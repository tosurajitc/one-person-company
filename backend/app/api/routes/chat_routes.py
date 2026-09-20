"""
chat_routes.py

POST /api/chat  — AI Genie conversational endpoint backed by Groq.

Quota limits (messages per day):
  free        →  20
  pro         →  200
  enterprise  →  unlimited (-1)
  anonymous   →  5  (demo, no auth required)

Chat history is persisted in `chat_messages` per session_id.  The last
HISTORY_WINDOW messages from the session are injected as context on every
request so the Genie remembers the conversation.
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import AuthService
from app.models.chat import ChatMessage, ChatRole
from app.models.user import User, UserRole
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

HISTORY_WINDOW = 10   # how many previous messages to send as context

DAILY_QUOTA: dict[str, int] = {
    "free":        20,
    "pro":        200,
    "enterprise":  -1,   # unlimited
    "anonymous":    5,
}

OPC_SYSTEM_PROMPT = """You are the OPC Genie — a sharp, practical AI business advisor built \
into OPC Genie, the One Person Company platform. Your sole mission is to help solo founders, \
independent consultants, and one-person businesses launch, run, and grow real companies.

Your personality:
- Direct and action-oriented. Skip pleasantries — get to the point.
- Specific, not generic. Always give the founder a concrete next step.
- Encouraging but honest. Never sugarcoat a bad idea; redirect it to something that works.
- You speak like a seasoned operator, not a textbook.

What you help with:
- Business model design and offer structuring
- Pricing strategy and revenue optimisation
- Writing sales copy, emails, social posts, and landing-page content
- Customer acquisition and lead generation tactics
- Running day-to-day operations as a solo founder
- Handling inbound customer queries and FAQs in the founder's voice
- Strategic decisions about tools, hiring (or not hiring), and focus

What you do NOT do:
- Give legal, tax, or financial investment advice (redirect to a licensed professional)
- Write code for the founder's product (that is out of scope)
- Make things up. If you do not know, say so and point to a better resource.

Always end your reply with one clear, actionable "Next step:" sentence if it helps the founder \
move forward immediately."""


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None   # client-managed; generated server-side if absent
    user_id: Optional[str] = None      # legacy field accepted but ignored (auth via header)


class ChatResponse(BaseModel):
    response: str
    session_id: str
    messages_used_today: int
    daily_limit: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_user(request: Request, db: Session) -> Optional[User]:
    """Extract user from JWT cookie or Authorization header. Returns None for anonymous."""
    token: Optional[str] = None

    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]

    if not token:
        token = request.cookies.get("token")

    if not token:
        return None

    return AuthService.get_user_from_token(token, db)


def _tier_for_user(user: Optional[User]) -> str:
    """Map a user's role to a quota tier label."""
    if user is None:
        return "anonymous"
    if user.role in (UserRole.SUPER_ADMIN, UserRole.ADMIN):
        return "enterprise"
    # TODO: replace with real subscription lookup once UserSubscription model exists
    return "free"


def _count_today(user_id: Optional[int], session_id: str, db: Session) -> int:
    """Count messages the user/session sent today (user role = USER only)."""
    start_of_day = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    query = db.query(ChatMessage).filter(
        ChatMessage.role == ChatRole.USER,
        ChatMessage.created_at >= start_of_day,
    )
    if user_id is not None:
        query = query.filter(ChatMessage.user_id == user_id)
    else:
        query = query.filter(ChatMessage.session_id == session_id)
    return query.count()


def _load_history(session_id: str, db: Session) -> list[dict]:
    """Load the last HISTORY_WINDOW messages for the session as Groq-compatible dicts."""
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(HISTORY_WINDOW)
        .all()
    )
    return [{"role": m.role.value, "content": m.content} for m in reversed(rows)]


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Send a message to the AI Genie (Groq-backed).

    - Authenticated users are identified by JWT (cookie or Bearer header).
    - Anonymous visitors may send up to 5 messages per session per day.
    - Session continuity is maintained via `session_id`; one is generated and
      returned if the client does not supply one.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Genie is not configured yet. Set GROQ_API_KEY in the environment.",
        )

    user = _get_current_user(request, db)
    tier = _tier_for_user(user)
    daily_limit = DAILY_QUOTA[tier]

    # Resolve / generate session_id
    session_id = (body.session_id or "").strip() or secrets.token_urlsafe(16)

    # Quota check
    messages_today = _count_today(
        user_id=user.id if user else None,
        session_id=session_id,
        db=db,
    )
    if daily_limit != -1 and messages_today >= daily_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Daily limit of {daily_limit} messages reached. "
                "Upgrade your plan for more."
            ),
        )

    # Build message list for Groq
    history = _load_history(session_id, db)
    groq_messages = [
        {"role": "system", "content": OPC_SYSTEM_PROMPT},
        *history,
        {"role": "user", "content": body.message},
    ]

    # Call Groq
    try:
        from groq import Groq  # imported here to avoid startup failure if not installed
        client = Groq(api_key=settings.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1024,
        )
        reply = completion.choices[0].message.content.strip()
    except Exception as exc:
        logger.error("Groq API error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Genie is temporarily unavailable. Please try again in a moment.",
        )

    # Persist both the user message and the assistant reply
    db.add(ChatMessage(
        user_id=user.id if user else None,
        session_id=session_id,
        role=ChatRole.USER,
        content=body.message,
    ))
    db.add(ChatMessage(
        user_id=user.id if user else None,
        session_id=session_id,
        role=ChatRole.ASSISTANT,
        content=reply,
    ))
    db.commit()

    return ChatResponse(
        response=reply,
        session_id=session_id,
        messages_used_today=messages_today + 1,
        daily_limit=daily_limit,
    )


# ---------------------------------------------------------------------------
# Prefill helpers
# ---------------------------------------------------------------------------
# Strategy: send the exact JSON skeleton as the prompt — model fills empty strings only.
# Two skeletons fired in parallel via asyncio.gather → latency = max(A, B).

# Default to a robust fallback list if the environment model fails or is scoped
FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
]

# ---------------------------------------------------------------------------
# Schema 2.0 prefill instruction + skeletons
# The model must return partial wizard state shaped like DEFAULT_STATE in the
# setup wizard (nested domain groups: identity, positioning, offers, proof…).
# Two skeletons keep each Groq call within token limits.
# ---------------------------------------------------------------------------

_PREFILL_INSTRUCTION = (
    "Fill every empty string in this JSON with concise content (max 12 words) that fits the described business. "
    "Return ONLY minified single-line JSON — no markdown fences, no newlines, no spaces after colons or commas. "
    "Keep all numbers, booleans, and fixed hrefs exactly as-is. "
    "deliverables: newline-separated list. priceInr/priceUsd: integers or empty string. ASCII only.\n"
)

# Skeleton A — identity, positioning, proof, frontDoor, knowledge, brand, channels
# NOTE: introVideo is intentionally left with empty strings — the LLM must NOT generate
# URLs. Programmatic defaults (wizard-schema.js / applyProgrammaticDefaults) fill it.
# FAQs: provide the array so the LLM fills it; backend will guarantee non-empty via defaults.
_SKELETON_A = (
    '{"identity":{"brandName":"","tagline":"","city":"","country":"","timezone":"Asia/Kolkata",'
    '"ownerName":"","ownerRole":"","email":"","whatsapp":"","photoUrl":"","logoUrl":""},'
    '"positioning":{"buyer":"","problem":"","outcome":"","timeframe":"","fear":"",'
    '"alreadyTried":"","credibility":"","forWho":["","",""],"notFor":["",""],'
    '"nicheScore":{"pain":3,"budget":3,"reach":3,"repeat":3,"cred":3}},'
    '"proof":{"yearsExperience":"","clientsServed":"","credentials":[""],'
    '"results":[{"number":"","label":""},{"number":"","label":""}],'
    '"caseStudies":[],'
    '"testimonials":[]},'
    '"frontDoor":{"primaryCta":"book_call","bookingUrl":"","ctaLabel":"","invitation":"",'
    '"responseTime":"Within 1 business day","workingHours":"",'
    '"channels":{"form":true,"whatsapp":true,"email":true,"booking":true},'
    '"formQuestions":["What does your business do?","What problem do you want solved?","When do you need it done?"]},'
    '"knowledge":{"process":[{"title":"Short call","detail":""},{"title":"Fixed proposal","detail":""},'
    '{"title":"Delivery","detail":""},{"title":"Walkthrough","detail":""}],'
    '"included":[""],"notIncluded":[""],"refundPolicy":"","toolsUsed":"",'
    '"faqs":[{"question":"","answer":""},{"question":"","answer":""},{"question":"","answer":""}],'
    '"introVideo":{"url":"","title":""}},'
    '"brand":{"style":"minimal","tone":"plain","primaryColor":"#2563eb","referenceSite":"","avoidWords":""},'
    '"channels":{"social":{"linkedin":"","instagram":"","facebook":"","youtube":"","x":"","googleBusiness":""},'
    '"mainPlatform":"linkedin","cadence":"weekly","newsletter":false,'
    '"contentTopics":["","",""],"publishedWork":[]}}'
)

# Skeleton B — start, offers, agents, payments, site
_SKELETON_B = (
    '{"start":{"description":"","businessType":"consulting","market":"india","language":"en"},'
    '"offers":{"tiers":['
    '{"tier":"front_door","name":"","summary":"","deliverables":"","duration":"","priceInr":"","priceUsd":""},'
    '{"tier":"core","name":"","summary":"","deliverables":"","duration":"","priceInr":"","priceUsd":""},'
    '{"tier":"recurring","name":"","summary":"","deliverables":"","duration":"","priceInr":"","priceUsd":""}],'
    '"product":{"enabled":false,"name":"","summary":"","link":"","priceInr":"","priceUsd":""},'
    '"mostBought":"core","paymentTerms":"50_50","revisionRounds":"2","priceDisplay":"show"},'
    '"agents":{"enabled":["blog","social","email","landing","facebook","proposals"],'
    '"autonomy":"draft_only",'
    '"guardrails":{"onlyListedPrices":true,"noDeadlines":true,"noInventedFacts":true,"logEveryRun":true},'
    '"monthlySpendCap":"",'
    '"facebook":{"goal":"","monthlyBudget":"","audience":"","competitorsToAvoid":""}},'
    '"payments":{"gateways":["razorpay","upi"],"structure":"sole_proprietor","legalName":"",'
    '"gstRegistered":"no","gstin":"","exportClients":"no","lutFiled":"no","invoicePrefix":"INV-",'
    '"legalPages":{"terms":true,"privacy":true,"refund":true}},'
    '"site":{"subdomain":"","customDomain":"","notifyEmail":"","analyticsId":""}}'
)


def _normalise_json(raw: str) -> dict:
    """Strip fences, fix unicode punctuation, collapse to minified JSON, parse."""
    import json as _json, re as _re
    raw = raw.strip()
    if "```" in raw:
        match = _re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
        if match:
            raw = match.group(1).strip()
        else:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
    for src, dst in [('\u2011','-'),('\u2013','-'),('\u2014','-'),
                     ('\u2018',"'"),('\u2019',"'"),('\u201c','"'),('\u201d','"')]:
        raw = raw.replace(src, dst)
    # Try direct parse first
    try:
        return _json.loads(raw)
    except _json.JSONDecodeError:
        pass
    # Try extracting outermost JSON object `{ ... }` if LLM added explanatory conversational text
    json_match = _re.search(r"\{[\s\S]*\}", raw)
    if json_match:
        try:
            return _json.loads(json_match.group(0))
        except _json.JSONDecodeError:
            pass
    # Collapse whitespace / trailing newlines then retry
    collapsed = _re.sub(r'\s+', ' ', raw)
    json_match2 = _re.search(r"\{[\s\S]*\}", collapsed)
    if json_match2:
        return _json.loads(json_match2.group(0))
    return _json.loads(collapsed)


async def _call_claude_prefill_async(description: str) -> dict:
    """Fallback prefill using Anthropic Claude (e.g. claude-3-5-haiku-20241022 or claude-3-haiku-20240307)."""
    import anthropic
    import asyncio as _asyncio

    aclient = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    haiku_model = getattr(settings, "ANTHROPIC_HAIKU_MODEL", None) or "claude-3-5-haiku-20241022"

    async def _call(skeleton: str, max_tok: int) -> dict:
        prompt = (
            f"{_PREFILL_INSTRUCTION}\n"
            f"Skeleton JSON:\n{skeleton}\n\n"
            f"User business description:\n{description}"
        )
        resp = await aclient.messages.create(
            model=haiku_model,
            max_tokens=max_tok,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.content[0].text if resp.content else ""
        return _normalise_json(text)

    part_a, part_b = await _asyncio.gather(
        _call(_SKELETON_A, 2500),
        _call(_SKELETON_B, 2000),
    )
    return {**part_b, **part_a}


async def _call_groq_prefill_async(description: str) -> dict:
    """
    Attempts Groq prefill first. If Groq encounters rate-limits, validation errors,
    or model issues, seamlessly falls back to Anthropic Claude (Haiku).
    """
    from groq import AsyncGroq
    import asyncio as _asyncio

    # Try Groq if configured
    if settings.GROQ_API_KEY:
        aclient = AsyncGroq(api_key=settings.GROQ_API_KEY)
        models_to_try = []
        try:
            model_list = await aclient.models.list()
            data = getattr(model_list, "data", []) or []
            available_ids = [m.id for m in data if getattr(m, "id", None)]
            logger.info("Available Groq models on this key: %s", available_ids)
            if settings.GROQ_MODEL and settings.GROQ_MODEL.strip() in available_ids:
                models_to_try.append(settings.GROQ_MODEL.strip())
            for m_id in available_ids:
                if m_id not in models_to_try and not any(skip in m_id for skip in ["whisper", "embedding", "guard", "vision", "audio", "orpheus"]):
                    models_to_try.append(m_id)
        except Exception as list_err:
            logger.warning("Could not list Groq models: %s", list_err)
            if settings.GROQ_MODEL and settings.GROQ_MODEL.strip():
                models_to_try.append(settings.GROQ_MODEL.strip())
            for fallback in FALLBACK_MODELS:
                if fallback not in models_to_try:
                    models_to_try.append(fallback)

        async def _call_groq(skeleton: str, max_tok: int) -> dict:
            last_err = None
            for model_name in models_to_try:
                try:
                    resp = await aclient.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": _PREFILL_INSTRUCTION + skeleton},
                            {"role": "user",   "content": description},
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.3,
                        max_tokens=max_tok,
                    )
                    return _normalise_json(resp.choices[0].message.content)
                except Exception as err:
                    logger.warning("Groq call failed with model %s: %s", model_name, err)
                    last_err = err
                    continue
            if last_err:
                raise last_err
            raise RuntimeError("All Groq model attempts failed.")

        try:
            part_a, part_b = await _asyncio.gather(
                _call_groq(_SKELETON_A, 2500),
                _call_groq(_SKELETON_B, 2000),
            )
            return {**part_b, **part_a}
        except Exception as groq_err:
            logger.warning("Groq prefill failed (%s). Falling back to Anthropic Claude...", groq_err)

    # Fallback to Anthropic Claude
    if settings.ANTHROPIC_API_KEY:
        logger.info("Executing prefill via Anthropic Claude fallback...")
        return await _call_claude_prefill_async(description)

    raise RuntimeError("Both Groq and Anthropic Claude prefill failed or are not configured.")


def _call_groq_prefill(description: str) -> dict:
    """Sync wrapper around the async parallel prefill. Called from sync FastAPI routes."""
    import asyncio as _asyncio
    try:
        loop = _asyncio.get_event_loop()
        if loop.is_running():
            # Already inside an event loop (e.g. async FastAPI route called this)
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                return ex.submit(_asyncio.run, _call_groq_prefill_async(description)).result()
        return loop.run_until_complete(_call_groq_prefill_async(description))
    except RuntimeError:
        return _asyncio.run(_call_groq_prefill_async(description))


class PrefillRequest(BaseModel):
    # Schema 2.0: the ai-website-builder sends the full structured intake
    schemaVersion: str = "2.0"
    description: str = ""           # composed description (always sent)
    start: dict = {}                # { businessType, market, language }
    basics: dict = {}               # { ownerName, brandName, email, whatsapp }
    answers: dict = {}              # { whatAndWho, problem, result, offersAndPrices, whyYou, notFit, howFound }
    links: dict = {}                # { website, linkedin, instagram, other }
    pastedMaterial: str = ""        # any raw text the user pasted


class PrefillResponse(BaseModel):
    prefill: dict
    needsConfirmation: list = []    # field paths Genie inferred (user should review)
    followUps: list = []            # optional clarifying questions
    saved: bool = False             # True if also persisted to user_site_settings


def _validate_description(description: str) -> str:
    description = description.strip()
    if not description:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="description must not be empty.",
        )
    if len(description) > 8000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="description must be 8000 characters or fewer.",
        )
    return description


def _build_description(body: PrefillRequest) -> str:
    """
    Compose the richest possible description string from the v2 intake.
    If the caller already set body.description (ai-website-builder composes it),
    use that directly.  Otherwise fall back to concatenating the answers dict.
    """
    if body.description.strip():
        return _validate_description(body.description)
    parts = list((body.answers or {}).values())
    if body.pastedMaterial.strip():
        parts.append(body.pastedMaterial.strip())
    composed = "\n\n".join(p for p in parts if p and p.strip())
    return _validate_description(composed)


@router.post("/chat/prefill", response_model=PrefillResponse)
async def chat_prefill(body: PrefillRequest):
    """
    Generate a schema 2.0 wizard prefill JSON from the full v2 intake.
    Does NOT save — use /chat/prefill-and-save to also persist to the user's profile.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Genie is not configured yet. Set GROQ_API_KEY in the environment.",
        )

    description = _build_description(body)

    try:
        prefill = await _call_groq_prefill_async(description)
    except __import__("json").JSONDecodeError as exc:
        logger.error("Prefill JSON parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Genie returned malformed data. Please try rephrasing your description.",
        )
    except Exception as exc:
        logger.error("Prefill Groq error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Genie is temporarily unavailable. Please try again in a moment.",
        )

    # Overlay the user's own basics over any Genie-inferred values
    if body.basics:
        identity = prefill.get("identity", {})
        for src_key, dst_key in [("ownerName", "ownerName"), ("brandName", "brandName"),
                                  ("email", "email"), ("whatsapp", "whatsapp")]:
            if body.basics.get(src_key, "").strip():
                identity[dst_key] = body.basics[src_key].strip()
        prefill["identity"] = identity
    if body.start:
        prefill_start = prefill.get("start", {})
        prefill_start.update({k: v for k, v in body.start.items() if v})
        prefill["start"] = prefill_start

    return PrefillResponse(prefill=prefill, saved=False)


@router.post("/chat/prefill-and-save", response_model=PrefillResponse)
async def chat_prefill_and_save(
    body: PrefillRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Generate the schema 2.0 wizard prefill JSON AND save it to the authenticated user's
    user_site_settings rows (one row per top-level key, schema_version='2.0').

    Requires a valid JWT (Bearer header or cookie).
    Falls back to prefill-only (saved=False) if the user is not authenticated.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Genie is not configured yet. Set GROQ_API_KEY in the environment.",
        )

    description = _build_description(body)

    try:
        prefill = await _call_groq_prefill_async(description)
    except __import__("json").JSONDecodeError as exc:
        logger.error("Prefill JSON parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Genie returned malformed data. Please try rephrasing your description.",
        )
    except Exception as exc:
        logger.error("Prefill Groq error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Genie is temporarily unavailable. Please try again in a moment.",
        )

    # Overlay the user's own basics over Genie-inferred values (same as /prefill)
    if body.basics:
        identity = prefill.get("identity", {})
        for src_key, dst_key in [("ownerName", "ownerName"), ("brandName", "brandName"),
                                  ("email", "email"), ("whatsapp", "whatsapp")]:
            if body.basics.get(src_key, "").strip():
                identity[dst_key] = body.basics[src_key].strip()
        prefill["identity"] = identity
    if body.start:
        prefill_start = prefill.get("start", {})
        prefill_start.update({k: v for k, v in body.start.items() if v})
        prefill["start"] = prefill_start

    # --- Attempt to save to user profile ---
    user = _get_current_user(request, db)
    if user is None:
        # Not logged in — return prefill without saving
        return PrefillResponse(prefill=prefill, saved=False)

    from app.models.user_site_settings import UserSiteSettings

    def _upsert(key: str, value) -> None:
        """Write one row to user_site_settings, tagging it as schema 2.0."""
        row = (
            db.query(UserSiteSettings)
            .filter(UserSiteSettings.user_id == user.id, UserSiteSettings.key == key)
            .first()
        )
        if row:
            row.value = value
            row.schema_version = "2.0"
        else:
            db.add(UserSiteSettings(user_id=user.id, key=key, value=value, schema_version="2.0"))

    # Persist each top-level domain group from the v2 prefill directly.
    # Keys mirror DEFAULT_STATE in setup-wizard/page.js.
    for group_key in ("start", "identity", "positioning", "offers", "proof",
                      "frontDoor", "knowledge", "brand", "agents", "payments",
                      "channels", "site"):
        if group_key in prefill:
            _upsert(group_key, prefill[group_key])

    try:
        db.commit()
        logger.info("Genie prefill (v2) saved to user_site_settings for user_id=%s", user.id)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to save Genie prefill for user %s: %s", user.id, exc)
        # Still return the prefill — the frontend can fall back to sessionStorage
        return PrefillResponse(prefill=prefill, saved=False)

    return PrefillResponse(prefill=prefill, saved=True)
