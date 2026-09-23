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


class FbInjectBriefRequest(BaseModel):
    session_id: str
    brief: dict   # the full launch brief JSON from /api/ad-agent/launch-brief


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


def _load_history(session_id: str, db: Session, window: int = 40) -> list[dict]:
    """Load the last `window` raw DB rows as Anthropic-format dicts.

    window=40 (was 20): a single large-JSON turn persists only 2 rows (user +
    assistant) but the progressive-chunking path used to write many ACK rows
    that inflated the window.  40 raw rows always yields at least 10 real turns
    even after ACK rows are filtered out.

    Enforces Anthropic's strict alternating-role requirement:
    - Drops any leading assistant messages (first message must be 'user').
    - Collapses consecutive same-role messages by keeping only the last one.
    - Skips synthetic chunk ACK messages injected by progressive processing.
    """
    rows = (
        db.query(AgentSessionMessage)
        .filter(AgentSessionMessage.session_id == session_id)
        .order_by(AgentSessionMessage.created_at.desc())
        .limit(window)
        .all()
    )
    raw: list[dict] = []
    for m in reversed(rows):
        role = "user" if m.role == AgentSessionMessageRole.USER else "assistant"
        content = m.content or ""
        # Skip synthetic ACK messages injected by _build_progressive_messages
        if content.startswith("✅ Received part ") and "Continuing to ingest" in content:
            continue
        # Skip chunk-label prefixes stored in the user turn
        if content.startswith("[Context part ") and "/ " in content[:25]:
            continue
        raw.append({"role": role, "content": content})

    # Collapse consecutive same-role messages (keep last of each run)
    collapsed: list[dict] = []
    for msg in raw:
        if collapsed and collapsed[-1]["role"] == msg["role"]:
            collapsed[-1] = msg   # overwrite with the later message
        else:
            collapsed.append(msg)

    # Anthropic requires first message to be 'user'
    while collapsed and collapsed[0]["role"] != "user":
        collapsed.pop(0)

    return collapsed


def _mask_sensitive(text: str) -> str:
    """Redact patterns that look like passwords, OTPs, or card numbers.

    Skips masking entirely when the payload looks like a JSON document
    (starts with '{' or '[') to avoid corrupting structured brief data.
    """
    stripped = text.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        return text
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
# Progressive context helpers
# ─────────────────────────────────────────────────────────────────────────────

# Rough character-to-token ratio for Claude models (conservative).
_CHARS_PER_TOKEN = 3.5

# Thresholds that switch from monolithic to progressive processing.
# A message above LARGE_MSG_CHARS is considered "large context".
_LARGE_MSG_CHARS = 1_500          # ~430 tokens of user message alone
_CHUNK_SIZE_CHARS = 3_000         # each progressive chunk ≤ ~860 tokens


def _estimate_tokens(text: str) -> int:
    """Return a conservative upper-bound token estimate for a string."""
    return max(1, int(len(text) / _CHARS_PER_TOKEN))


def _build_progressive_messages(
    history: list[dict],
    large_message: str,
    state_dict: dict,
) -> tuple[list[dict], str]:
    """Split a large user message into chunks and build a multi-turn
    message list that feeds the content progressively to Claude.

    Returns (messages_list, final_user_content) where messages_list
    contains the history plus all but the last chunk as completed
    user/assistant pairs, and final_user_content is the last chunk
    that will be appended as the live user turn by the caller.

    For payloads below _LARGE_MSG_CHARS this is a no-op and the
    original message is returned unchanged in the final slot.
    """
    if len(large_message) <= _LARGE_MSG_CHARS:
        # Monolithic path — nothing to split.
        return history, large_message

    # Split on natural boundaries first (double-newline), then hard-split.
    raw_chunks: list[str] = []
    remaining = large_message
    while len(remaining) > _CHUNK_SIZE_CHARS:
        # Try to split on the last double-newline within the window.
        window = remaining[:_CHUNK_SIZE_CHARS]
        split_pos = window.rfind("\n\n")
        if split_pos == -1:
            split_pos = window.rfind("\n")
        if split_pos == -1:
            split_pos = _CHUNK_SIZE_CHARS
        raw_chunks.append(remaining[:split_pos].strip())
        remaining = remaining[split_pos:].strip()
    if remaining:
        raw_chunks.append(remaining)

    total = len(raw_chunks)
    if total == 1:
        # After splitting there was only one piece — treat monolithically.
        return history, raw_chunks[0]

    # Build progressive turns: chunks 0..N-2 are injected as completed
    # user/assistant exchanges so Claude receives each section in context.
    progressive: list[dict] = list(history)
    for i, chunk in enumerate(raw_chunks[:-1]):
        chunk_label = f"[Context part {i + 1}/{total}]\n{chunk}"
        ack = (
            f"✅ Received part {i + 1} of {total}. "
            f"Continuing to ingest the remaining context…"
        )
        progressive.append({"role": "user", "content": chunk_label})
        progressive.append({"role": "assistant", "content": ack})

    # The last chunk is the actual question/request turn.
    final_chunk = f"[Context part {total}/{total} — final]\n{raw_chunks[-1]}"
    return progressive, final_chunk


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
    - Large messages (> _LARGE_MSG_CHARS chars) are split into progressive chunks so the
      model receives each section in a completed user/assistant exchange before seeing the
      final question — avoiding context-window overflows on brief/document uploads.
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

    # Mask sensitive content in incoming message.
    # _mask_sensitive skips JSON payloads automatically to avoid corruption.
    clean_message = _mask_sensitive(body.message)

    # Reject unreasonably large single messages before touching the LLM.
    # 120 000 chars ≈ ~34 000 tokens — well within Claude's 200 k window but
    # a sane guard against accidental multi-MB pastes.
    _MAX_MSG_CHARS = 120_000
    if len(clean_message) > _MAX_MSG_CHARS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Message too large ({len(clean_message):,} chars). "
                f"Maximum allowed is {_MAX_MSG_CHARS:,} chars per turn. "
                "Please use the Campaign Brief handoff flow instead of pasting raw JSON."
            ),
        )

    # Load persisted user context state
    state_row, state_dict = _load_or_create_state(body.session_id, db)

    # Build the system prompt with injected user context
    user_context_block = (
        f"\n\n<user_context>\n{json.dumps(state_dict, indent=2)}\n</user_context>\n\n"
        "Use this context. Update guidance based on completed steps. Do not re-ask answered questions."
    )
    full_system = FB_SYSTEM_PROMPT + user_context_block

    # Load conversation history
    history = _load_history(body.session_id, db)

    # Progressive context split: large messages are chunked into completed
    # user/assistant pairs so Claude receives every section in its context
    # window without a single-turn token spike.
    messages_with_chunks, final_user_content = _build_progressive_messages(
        history, clean_message, state_dict
    )

    # Scale max_tokens with estimated input size so large contexts still get
    # a full response. Cap at 8192 (Claude Sonnet's output limit per call).
    estimated_input_tokens = (
        _estimate_tokens(full_system)
        + sum(_estimate_tokens(m["content"]) for m in messages_with_chunks)
        + _estimate_tokens(final_user_content)
    )
    # Reserve output budget from the remaining context window.
    # Guard: if estimated input somehow exceeds _CONTEXT_WINDOW (shouldn't happen
    # after the 120k char guard above, but defensive), always give at least
    # _OUTPUT_FLOOR tokens so the model can return a meaningful error reply
    # rather than failing with max_tokens=0 or a negative value.
    _OUTPUT_FLOOR = 4_096
    _OUTPUT_CAP = 8_192
    _CONTEXT_WINDOW = 200_000
    remaining = _CONTEXT_WINDOW - estimated_input_tokens
    dynamic_max_tokens = max(_OUTPUT_FLOOR, min(_OUTPUT_CAP, remaining))
    logger.debug(
        "fb-agent progressive: msg_len=%d chunks=%d est_input_tokens=%d max_tokens=%d",
        len(clean_message),
        len(messages_with_chunks) - len(history) + 1,  # net new turns added
        estimated_input_tokens,
        dynamic_max_tokens,
    )

    # Call Claude Sonnet — use AsyncAnthropic so the async handler never blocks
    # the uvicorn event loop (sync client.messages.create causes ECONNRESET on
    # long-running or chunked requests by stalling the entire worker thread).
    try:
        import anthropic  # lazy import — avoids startup failure if not installed

        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        # temperature is not accepted by Claude 4 models (claude-sonnet-4-x / claude-opus-4-x)
        # in the current SDK — omit it so the API uses the model's default.
        response = await client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=dynamic_max_tokens,
            system=[
                {
                    "type": "text",
                    "text": full_system,
                    "cache_control": {"type": "ephemeral"},   # prompt caching on the long static prompt
                }
            ],
            messages=[
                *messages_with_chunks,
                {"role": "user", "content": final_user_content},
            ],
        )
        raw_reply: str = response.content[0].text
        logger.info(
            "fb-agent raw_reply (first 200 chars): %r  stop_reason=%s",
            raw_reply[:200],
            response.stop_reason,
        )

    except BaseException as exc:
        # Catch BaseException (not just Exception) so asyncio.CancelledError —
        # raised when the client disconnects or uvicorn times out — is also
        # logged rather than silently killing the worker connection.
        logger.error("Anthropic API error (fb-agent): %s [%s]", exc, type(exc).__name__, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"FB Marketing Agent is temporarily unavailable. ({type(exc).__name__}: {exc})",
        )

    # Strip hidden state_update block and parse it
    state_match = _STATE_BLOCK_RE.search(raw_reply)
    visible_reply = _STATE_BLOCK_RE.sub("", raw_reply).strip()

    # Guard: if stripping the state block left an empty reply, log and recover
    if not visible_reply:
        logger.warning(
            "fb-agent: visible_reply is empty after stripping state_update. "
            "raw_reply=%r", raw_reply[:400]
        )
        visible_reply = "I've processed your request and updated the campaign context. What would you like to work on next?"

    if state_match:
        try:
            state_update = json.loads(state_match.group(1).strip())
            state_dict = _apply_state_update(state_dict, state_update)
            state_row.state_json = json.dumps(state_dict)
            db.add(state_row)
        except (json.JSONDecodeError, Exception) as e:
            logger.warning("Failed to parse state_update from model: %s", e)

    # Accumulate token usage on the user row
    call_tokens = (getattr(response.usage, "input_tokens", 0) or 0) + \
                  (getattr(response.usage, "output_tokens", 0) or 0)
    if call_tokens:
        current_user = _get_current_user(request, db)
        if current_user:
            current_user.ai_tokens_used = (current_user.ai_tokens_used or 0) + call_tokens
            db.add(current_user)

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

    # Round-trip state_dict through JSON to guarantee it contains only
    # plain serializable types before Pydantic validates the response model.
    # Claude's state_update can introduce unexpected types that cause 500s.
    try:
        safe_state = json.loads(json.dumps(state_dict))
    except (TypeError, ValueError) as e:
        logger.warning("fb-agent: state_dict not JSON-serializable, returning empty state: %s", e)
        safe_state = {}

    return FbChatResponse(reply=visible_reply, session_id=body.session_id, state=safe_state)


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


@router.post("/inject-brief")
def inject_campaign_brief(
    body: FbInjectBriefRequest,
    db: Session = Depends(get_db),
):
    """
    Pre-loads the FB Growth Coach session state from a completed Campaign Launch Brief.
    Maps brief fields into FbAgentState so the agent starts with full campaign context —
    skipping discovery questions entirely.
    Call this before opening the content-studio chat to hand off the brief.
    """
    brief = body.brief
    meta = brief.get("meta", {})
    structured = brief.get("structured", {})
    copy_placement = brief.get("step3_copy_placement", [])
    rule_guidance = brief.get("step4_rule_guidance", [])
    perf_estimates = structured.get("performance_estimates", [])

    # Build the pre-filled user profile from brief data
    state_dict = json.loads(json.dumps(DEFAULT_STATE))  # deep copy

    profile = state_dict["user_profile"]
    profile["country"] = "IN"
    profile["currency"] = "INR"
    profile["skill_level"] = "beginner"

    biz = profile["business"]
    biz["product"] = meta.get("niche", "")
    biz["offer"] = structured.get("campaign_type", "")
    biz["usp"] = meta.get("niche", "")

    goal = profile["goal"]
    goal["primary"] = structured.get("campaign_objective", "")
    goal["kpi"] = (perf_estimates[0].get("metric", "") if perf_estimates else "")
    goal["target"] = (perf_estimates[0].get("target", "") if perf_estimates else "")

    budget_val = meta.get("monthly_budget", "")
    # Parse numeric value from budget string (e.g. "₹10,000" → 10000)
    try:
        import re as _re
        budget_num = int(_re.sub(r"[^\d]", "", str(budget_val)) or 0)
    except (ValueError, TypeError):
        budget_num = 0
    profile["budget"]["monthly_ad_budget"] = budget_num
    profile["budget"]["organic_only"] = False

    assets = profile["assets"]
    assets["pixel"] = (structured.get("capi_ready_count", 0) > 0)
    assets["capi"] = (structured.get("capi_ready_count", 0) > 0)

    # Mark discovery as complete and set progress to Phase 3 (Paid Advertising Setup)
    progress = state_dict["progress"]
    progress["current_phase"] = 3
    progress["completed_steps"] = [
        "Business basics gathered",
        "Goals and budget confirmed",
        "Audience and assets reviewed",
        "Campaign strategy set (Step 1)",
        "Tracking & CAPI configured (Step 2)",
        "Ad copy approved (Step 3)",
        "Kill/Scale rules set (Step 4)",
    ]
    progress["next_action"] = "Review copy placement per funnel stage and confirm audience segments before launch."
    progress["open_questions"] = [
        "Do you have a Custom Audience from existing website visitors or email list?",
        "Which creative asset (image or video) will you pair with each approved copy angle?",
    ]

    # Store approved copies and rules as deliverables
    deliverables = []
    for cp in copy_placement:
        deliverables.append({
            "type": "ad_copy",
            "funnel_stage": cp.get("funnel_stage", ""),
            "angle": cp.get("angle", ""),
            "audience_segment": cp.get("audience_segment", ""),
            "format": cp.get("recommended_format", ""),
            "headline": cp.get("full_copy", {}).get("headline", ""),
            "primary_text": cp.get("full_copy", {}).get("primary_text", ""),
            "cta": cp.get("full_copy", {}).get("cta", ""),
        })
    for rg in rule_guidance:
        deliverables.append({
            "type": "automation_rule",
            "rule_type": rg.get("type", ""),
            "description": rg.get("description", ""),
            "meta_ui_path": rg.get("meta_ui_path", ""),
            "enabled": rg.get("enabled", True),
        })
    state_dict["deliverables"] = deliverables

    # Persist to DB
    row = db.query(FbAgentState).filter(FbAgentState.session_id == body.session_id).first()
    if row is None:
        row = FbAgentState(session_id=body.session_id, state_json=json.dumps(state_dict))
        db.add(row)
    else:
        row.state_json = json.dumps(state_dict)
        db.add(row)
    db.commit()

    return {
        "success": True,
        "session_id": body.session_id,
        "agent_handoff_prompt": brief.get("agent_handoff_prompt", ""),
        "state": state_dict,
    }
