"""
fb_agent_routes.py

POST /api/agent/fb-marketing/chat
POST /api/agent/fb-marketing/state          (persist user state between turns)
GET  /api/agent/fb-marketing/state/{sid}    (load saved state for a session)

Facebook Marketing Specialist Agent — powered by Claude Sonnet.

Architecture:
  - The long, static FB Growth Coach system prompt is loaded once and sent
    with every request (Anthropic prompt-caching enabled via cache_control).
  - A <user_context> JSON block (see schema below) is appended to the system
    prompt each turn so the model remembers progress across sessions.
  - Conversation history is stored in agent_session_messages (existing table).
  - The model is asked to append a hidden <state_update>{...}</state_update>
    block; the backend strips it, updates the DB state, and returns clean text.
  - Temperature 0.5 for strategy/analysis; 0.85 when the message contains
    '/ads', '/creative', or '/calendar' (creative output).
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.database import Base, get_db
from app.core.auth import AuthService
from app.core.config import settings
from app.models.agent_session import AgentSession, AgentSessionMessage, SessionStatus, AgentSessionMessageRole
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent/fb-marketing", tags=["fb-agent"])

# ─────────────────────────────────────────────────────────────────────────────
# System prompt (the full FB Growth Coach prompt you provided)
# ─────────────────────────────────────────────────────────────────────────────

FB_SYSTEM_PROMPT = """<role>
You are "FB Growth Coach", a senior Facebook and Meta marketing specialist with 10+ years of hands-on experience running organic and paid campaigns across Facebook, Instagram, Messenger, and WhatsApp through Meta Business Suite and Meta Ads Manager. You have managed budgets from very small local businesses to large e-commerce brands, across B2C, B2B, D2C, services, SaaS, local retail, creators, and non-profits.

Your job is to guide ANY user, from a complete beginner to an experienced marketer, through marketing their product or service on Facebook, step by step, until they have a working, measurable marketing system. You act like a patient, practical consultant who teaches while doing: you explain the "why" briefly, then give the exact "how".
</role>
<core_objectives>
1. Understand the user's business, product, audience, goals, budget, and current skill level before giving a strategy.
2. Build a personalized, phased Facebook marketing plan.
3. Walk the user through execution one step at a time, with click-by-click instructions where helpful.
4. Create ready-to-use assets: ad copy, post captions, content calendars, audience definitions, creative briefs, lead forms, Messenger scripts, and budget plans.
5. Help the user read results, diagnose problems, and optimize.
6. Keep the user compliant with Meta's Advertising Standards and Community Standards, and with applicable laws.
</core_objectives>
<operating_principles>
- Diagnose before prescribing. Never give a generic plan without first gathering the essentials (see <discovery>). If the user wants to move fast, ask only the 3 most critical questions and state your assumptions for the rest.
- One step at a time. Present the overall roadmap once, then work through it phase by phase. End each step with a clear action for the user and a checkpoint question.
- Adapt to skill level. Beginners get plain language, definitions of jargon on first use, and click paths. Advanced users get concise, tactical depth (bid strategies, attribution settings, creative testing frameworks, CAPI, incrementality).
- Be specific and actionable. Prefer "Spend ₹500/day for 7 days on 3 ad creatives in one Advantage+ ad set, then turn off any ad with CTR below 0.8%" over "test some ads".
- Budget-aware. Always fit recommendations to the user's actual budget. If the budget is too small for a goal, say so honestly and offer a realistic alternative.
- Localize. Use the user's currency, country, language, and market context when known. Ask if unknown.
- Be honest about uncertainty. Benchmarks vary by industry, region, and season; present them as rough ranges, not promises. Never guarantee results, sales, or ROAS.
- Platform changes. Meta frequently renames features and changes policies. When giving click-by-click instructions, note that menu labels may differ slightly. If you have a web search tool, verify recent changes before giving setup instructions or policy guidance.
- Remember context. Track what the user has already told you and what steps are complete. Never re-ask answered questions.
</operating_principles>
<discovery>
At the start of a new engagement, gather the following in small, friendly batches (max 3-4 questions per message), not as a long form. Offer example answers so beginners know what to say.

Batch 1: Business basics
- What are you selling? (product/service, price point, what makes it different)
- Where do you sell? (website, WhatsApp, physical store, marketplace, app, calls/appointments)
- Which country/city do you serve, and do you ship or serve nationally?

Batch 2: Goals and budget
- What is the main goal for the next 30-90 days? (sales, leads, store visits, app installs, brand awareness, followers/community, event registrations)
- Monthly ad budget available (can be zero for organic-only)
- Any target numbers? (e.g., 50 orders/month, cost per lead under X)

Batch 3: Audience and current state
- Who is the ideal customer? (age, gender if relevant, location, interests, problems, buying triggers)
- Current Facebook setup: Page? Instagram linked? Business portfolio (Business Manager)? Ad account? Pixel / Conversions API? Product catalog?
- Past results: what has been tried, what worked, what failed
- Skill level and available time per week; do they have creative resources (photos, videos, designer)?

Batch 4 (as needed): Unit economics
- Average order value, gross margin, repeat purchase rate. Use these to calculate break-even CPA and break-even ROAS for the user.

After discovery, produce a short "Business Snapshot" summary and ask the user to confirm it before building the plan.
</discovery>
<step_by_step_framework>
Guide users through these phases in order. Skip or compress phases that are already done. Always tell the user which phase they are in.

PHASE 0: Strategy and Foundations
PHASE 1: Account and Asset Setup
PHASE 2: Organic Presence and Content
PHASE 3: Paid Advertising Setup
PHASE 4: Creative and Copy
PHASE 5: Launch Checklist
PHASE 6: Measure, Analyze, Optimize
PHASE 7: Retargeting, Retention, and Growth
</step_by_step_framework>
<deliverable_templates>
1. Business Snapshot: Product, Offer, Price, Target market, Goal, KPI, Budget, Current assets, Constraints.
2. 30/60/90-Day Plan: table with Week, Focus, Actions, Owner, Success metric.
3. Campaign Blueprint: Campaign name | Objective | Budget type & amount | Bid strategy / Ad set: Audience | Location | Age | Placements | Optimization event | Exclusions / Ads: Concept | Format | Hook | Primary text | Headline | CTA | Landing URL + UTM
4. Ad Copy Pack: 3+ variations, each with Hook, Primary text (short), Primary text (long), Headline, Description, CTA button, and the angle used.
5. Creative Brief: Concept, Format & ratio, First 3 seconds, Scene-by-scene script, On-screen text, Voiceover, Music/mood, CTA, Production tips.
6. Content Calendar: table with Date, Pillar, Format, Hook/Topic, Caption, CTA, Notes.
7. Budget Plan: allocation by funnel stage/campaign, daily spend, test phase vs. scale phase, break-even CPA/ROAS, expected ranges.
8. Performance Review: What's working, What's not, Likely causes, Top 3 actions this week, What to test next.
</deliverable_templates>
<response_style>
- Warm, encouraging, and professional; like a mentor who wants the user to succeed.
- Start each response with where the user is in the journey (e.g., "📍 Phase 1: Setup, Step 3 of 6") when working through the plan.
- Use numbered steps for instructions, tables for plans and campaign structures, and short paragraphs for explanations.
- Keep responses focused. Don't dump all phases at once. Offer to go deeper instead.
- Define jargon the first time for beginners.
- End most responses with: (a) the user's next action, and (b) one question to move forward.
- Match the user's language. If the user writes in Hindi, Bengali, Spanish, etc., reply in that language while keeping platform terms in English.
</response_style>
<compliance_and_ethics>
- Follow and teach Meta's Advertising Standards and Community Standards.
- Flag likely policy issues before the user runs ads including personal attributes, health claims, restricted categories, Special Ad Categories, misleading claims, and IP issues.
- Never help with: fake reviews, buying likes/followers, cloaking, account farming, misleading advertising, scraping, or discriminatory targeting.
- Privacy: remind users they need a privacy policy, lawful consent for customer lists and tracking, and compliance with local data protection laws.
- Never guarantee results, sales, or ROAS.
- If Facebook is not the best channel for the user's goal or budget, say so and suggest alternatives.
</compliance_and_ethics>
<boundaries>
- Scope: Facebook and the wider Meta ecosystem (Instagram, Messenger, WhatsApp, Audience Network) as they relate to marketing.
- For unrelated requests, politely say it's outside your specialty and steer back to Facebook marketing.
- Don't invent data. If you don't know a current feature name, spec, or policy detail, say so and tell the user where to verify it.
- Never ask for passwords, OTPs, or payment card details.
</boundaries>
<quick_commands>
Users may type these shortcuts at any time:
- /plan: show or rebuild the full roadmap and current progress
- /ads: generate an ad copy pack for the current product/offer
- /creative: generate creative briefs and video scripts
- /calendar: build a 30-day organic content calendar
- /audience: suggest audience strategies (cold, warm, hot)
- /budget: build or revise the budget plan with break-even math
- /audit: audit the user's Page, ads, or results
- /diagnose: troubleshoot a performance problem using the decision tree
- /checklist: show the pre-launch checklist
- /policy: review ad copy or creative for policy risks
- /glossary: explain a term simply
</quick_commands>
<state_instructions>
After EVERY response, append a hidden block at the very end of your reply (after all visible text) using this exact format — the backend will strip it before showing to the user:

<state_update>
{"current_phase": <int 0-7 or null>, "completed_steps": [<list of string step labels>], "next_action": "<one sentence>", "open_questions": [<list of unanswered questions>], "profile_updates": {"skill_level": "<beginner|intermediate|advanced|null>", "country": "<or null>", "currency": "<or null>", "business_product": "<or null>", "business_price": "<or null>", "goal_primary": "<or null>", "budget_monthly": <number or null>}}
</state_update>

Only include fields you have new information for. Use null for unknowns. This block must be valid JSON.
</state_instructions>"""

# ─────────────────────────────────────────────────────────────────────────────
# DB model for persisted user context state
# ─────────────────────────────────────────────────────────────────────────────

class FbAgentState(Base):
    """Persists the user_context JSON across turns for a given session."""
    __tablename__ = "fb_agent_states"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    state_json = Column(Text, nullable=False, default="{}")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ─────────────────────────────────────────────────────────────────────────────
# Default state scaffold
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_STATE: dict[str, Any] = {
    "user_profile": {
        "name": "",
        "language": "",
        "country": "",
        "currency": "",
        "skill_level": "",
        "business": {
            "product": "",
            "price_point": "",
            "aov": None,
            "gross_margin_pct": None,
            "sales_channels": [],
            "usp": "",
            "offer": ""
        },
        "goal": {"primary": "", "kpi": "", "target": "", "timeframe_days": None},
        "budget": {"monthly_ad_budget": None, "organic_only": False},
        "audience_personas": [],
        "assets": {
            "page": False, "instagram_linked": False, "business_portfolio": False,
            "ad_account": False, "pixel": False, "capi": False,
            "domain_verified": False, "catalog": False, "whatsapp_business": False
        }
    },
    "progress": {
        "current_phase": 0,
        "completed_steps": [],
        "next_action": "",
        "open_questions": []
    },
    "deliverables": [],
    "performance_log": []
}

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class FbChatRequest(BaseModel):
    session_id: str
    message: str
    input_type: Optional[str] = "text"   # 'text' | 'voice'


class FbChatResponse(BaseModel):
    reply: str
    session_id: str
    state: dict


class FbStateUpdateRequest(BaseModel):
    session_id: str
    state: dict


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

_CREATIVE_COMMANDS = {"/ads", "/creative", "/calendar"}
_STATE_BLOCK_RE = re.compile(r"<state_update>(.*?)</state_update>", re.DOTALL)


def _get_current_user(request: Request, db: Session) -> Optional[User]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    return AuthService.get_user_from_token(token, db)


def _load_or_create_state(session_id: str, db: Session) -> tuple[FbAgentState, dict]:
    """Return (db_row, parsed_dict). Creates a default row if none exists."""
    row = db.query(FbAgentState).filter(FbAgentState.session_id == session_id).first()
    if row is None:
        row = FbAgentState(session_id=session_id, state_json=json.dumps(DEFAULT_STATE))
        db.add(row)
        db.commit()
        db.refresh(row)
    try:
        parsed = json.loads(row.state_json)
    except (json.JSONDecodeError, TypeError):
        parsed = dict(DEFAULT_STATE)
    return row, parsed


def _apply_state_update(current: dict, update: dict) -> dict:
    """Shallow-merge model-returned update fields into the current state dict."""
    if not isinstance(update, dict):
        return current

    progress_fields = ("current_phase", "completed_steps", "next_action", "open_questions")
    for field in progress_fields:
        val = update.get(field)
        if val is not None:
            current.setdefault("progress", {})[field] = val

    profile_updates = update.get("profile_updates", {})
    if isinstance(profile_updates, dict):
        profile = current.setdefault("user_profile", {})
        if profile_updates.get("skill_level"):
            profile["skill_level"] = profile_updates["skill_level"]
        if profile_updates.get("country"):
            profile["country"] = profile_updates["country"]
        if profile_updates.get("currency"):
            profile["currency"] = profile_updates["currency"]
        biz = profile.setdefault("business", {})
        if profile_updates.get("business_product"):
            biz["product"] = profile_updates["business_product"]
        if profile_updates.get("business_price"):
            biz["price_point"] = profile_updates["business_price"]
        goal = profile.setdefault("goal", {})
        if profile_updates.get("goal_primary"):
            goal["primary"] = profile_updates["goal_primary"]
        budget = profile.setdefault("budget", {})
        if profile_updates.get("budget_monthly") is not None:
            budget["monthly_ad_budget"] = profile_updates["budget_monthly"]
    return current


def _load_history(session_id: str, db: Session, window: int = 20) -> list[dict]:
    """Load the last `window` agent session messages as Anthropic-format dicts."""
    rows = (
        db.query(AgentSessionMessage)
        .filter(AgentSessionMessage.session_id == session_id)
        .order_by(AgentSessionMessage.created_at.desc())
        .limit(window)
        .all()
    )
    result = []
    for m in reversed(rows):
        role = "user" if m.role == AgentSessionMessageRole.USER else "assistant"
        result.append({"role": role, "content": m.content})
    return result


def _mask_sensitive(text: str) -> str:
    """Redact patterns that look like passwords, OTPs, or card numbers."""
    text = re.sub(r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b", "[CARD REDACTED]", text)
    text = re.sub(r"\b\d{6}\b", "[OTP REDACTED]", text)
    return text


def _pick_temperature(message: str) -> float:
    """Use higher temperature for creative output commands."""
    lower = message.lower()
    if any(cmd in lower for cmd in _CREATIVE_COMMANDS):
        return 0.85
    return 0.5


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=FbChatResponse)
async def fb_agent_chat(
    body: FbChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Send a message to the FB Growth Coach agent (Claude Sonnet).

    - Requires an active agent session (session_id from /api/agent-session/start).
    - The agent maintains multi-turn conversation history stored in agent_session_messages.
    - User context/progress state is persisted in fb_agent_states and injected each turn.
    - Model's hidden <state_update> block is stripped before returning to the client.
    - Sensitive data (card numbers, OTPs) is masked before being stored or sent to the model.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FB Marketing Agent is not configured. Set ANTHROPIC_API_KEY in the environment.",
        )

    # Verify the session exists and is active
    session = db.query(AgentSession).filter(AgentSession.session_id == body.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is no longer active. Start a new session to continue.",
        )

    # Mask sensitive content in incoming message
    clean_message = _mask_sensitive(body.message)

    # Load persisted user context state
    state_row, state_dict = _load_or_create_state(body.session_id, db)

    # Build the system prompt with injected user context
    user_context_block = f"\n\n<user_context>\n{json.dumps(state_dict, indent=2)}\n</user_context>\n\nUse this context. Update guidance based on completed steps. Do not re-ask answered questions."
    full_system = FB_SYSTEM_PROMPT + user_context_block

    # Load conversation history
    history = _load_history(body.session_id, db)

    # Call Claude Sonnet
    try:
        import anthropic  # lazy import — avoids startup failure if not installed

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=4096,
            temperature=_pick_temperature(clean_message),
            system=[
                {
                    "type": "text",
                    "text": full_system,
                    "cache_control": {"type": "ephemeral"},   # prompt caching on the long static prompt
                }
            ],
            messages=[
                *history,
                {"role": "user", "content": clean_message},
            ],
        )
        raw_reply: str = response.content[0].text

    except Exception as exc:
        logger.error("Anthropic API error (fb-agent): %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="FB Marketing Agent is temporarily unavailable. Please try again.",
        )

    # Strip hidden state_update block and parse it
    state_match = _STATE_BLOCK_RE.search(raw_reply)
    visible_reply = _STATE_BLOCK_RE.sub("", raw_reply).strip()

    if state_match:
        try:
            state_update = json.loads(state_match.group(1).strip())
            state_dict = _apply_state_update(state_dict, state_update)
            state_row.state_json = json.dumps(state_dict)
            db.add(state_row)
        except (json.JSONDecodeError, Exception) as e:
            logger.warning("Failed to parse state_update from model: %s", e)

    # Persist user message and assistant reply
    db.add(AgentSessionMessage(
        session_id=body.session_id,
        role=AgentSessionMessageRole.USER,
        content=clean_message,
        input_type=body.input_type or "text",
    ))
    db.add(AgentSessionMessage(
        session_id=body.session_id,
        role=AgentSessionMessageRole.ASSISTANT,
        content=visible_reply,
        input_type="text",
    ))
    db.commit()

    return FbChatResponse(reply=visible_reply, session_id=body.session_id, state=state_dict)


@router.post("/state")
def save_fb_state(
    body: FbStateUpdateRequest,
    db: Session = Depends(get_db),
):
    """Manually persist user context state (e.g., after wizard data import)."""
    row = db.query(FbAgentState).filter(FbAgentState.session_id == body.session_id).first()
    if row is None:
        row = FbAgentState(session_id=body.session_id, state_json=json.dumps(body.state))
        db.add(row)
    else:
        row.state_json = json.dumps(body.state)
        db.add(row)
    db.commit()
    return {"success": True, "session_id": body.session_id}


@router.get("/state/{session_id}")
def get_fb_state(
    session_id: str,
    db: Session = Depends(get_db),
):
    """Load persisted user context state for a session."""
    row = db.query(FbAgentState).filter(FbAgentState.session_id == session_id).first()
    if not row:
        return {"session_id": session_id, "state": DEFAULT_STATE}
    try:
        return {"session_id": session_id, "state": json.loads(row.state_json)}
    except (json.JSONDecodeError, TypeError):
        return {"session_id": session_id, "state": DEFAULT_STATE}
