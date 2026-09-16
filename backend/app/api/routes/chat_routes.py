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
# groq/compound-mini: reliable, no OTPM limit issues, parallel calls ≈ 8-10s total.
# Two skeletons fired in parallel via asyncio.gather → latency = max(A, B).

PREFILL_MODEL = "groq/compound-mini"

_PREFILL_INSTRUCTION = (
    "Fill every empty string in this JSON with short content (max 10 words) for the described business. "
    "Return ONLY minified single-line JSON (no newlines, no spaces after colons/commas). "
    "Keep numbers, booleans, fixed hrefs unchanged. "
    "featuresText: pipe-separated features e.g. feat1|feat2|feat3. "
    "monthlyPrice/price: integers. currency: INR for India. ASCII only.\n"
)

# Skeleton A — brand, hero, stats, valueProps, features, CTA, footer (~30 keys)
_SKELETON_A = (
    '{"brandName":"","tagline":"","description":"","siteName":"","siteDescription":"","location":"",'
    '"heroBadge":"","heroHeadline":"","heroSubheadline":"","heroHighlightWord":"",'
    '"heroPrimaryText":"","heroPrimaryHref":"/setup-wizard",'
    '"heroSecondaryText":"","heroSecondaryHref":"/platform/ai-genie-assistant",'
    '"stats":[{"number":"","label":""},{"number":"","label":""},{"number":"","label":""},{"number":"","label":""}],'
    '"trustedBy":"","whyDifferentTitle":"","whyDifferentSubtitle":"",'
    '"valueProps":[{"title":"","description":"","highlight":""},{"title":"","description":"","highlight":""},{"title":"","description":"","highlight":""}],'
    '"features":[{"title":"","description":"","preview":"","link":"/","status":"Available"},{"title":"","description":"","preview":"","link":"/","status":"Available"},{"title":"","description":"","preview":"","link":"/","status":"Coming Soon"}],'
    '"ctaHeadline":"","ctaSubheadline":"","ctaPrimaryText":"","ctaSecondaryText":"",'
    '"badge0":"","badge1":"","badge2":"",'
    '"footerPlatform":[{"name":"","href":""},{"name":"","href":""},{"name":"","href":""}],'
    '"footerResources":[{"name":"Blog","href":"/blog"},{"name":"Contact","href":"/contact"},{"name":"Help","href":"/help"}],'
    '"footerCompany":[{"name":"About","href":"/about"},{"name":"Privacy","href":"/privacy"},{"name":"Terms","href":"/terms"}]}'
)

# Skeleton B — pricing, offers, marketing (~16 keys)
_SKELETON_B = (
    '{"currency":"",'
    '"plans":[{"name":"","description":"","badge":"","monthlyPrice":0,"buttonText":"","buttonHref":"/setup-wizard","target":"","highlight":false,"featuresText":"f1|f2|f3","restrictionsText":""},'
    '{"name":"","description":"","badge":"Most Popular","monthlyPrice":0,"buttonText":"","buttonHref":"/setup-wizard","target":"","highlight":true,"featuresText":"f1|f2|f3|f4","restrictionsText":""},'
    '{"name":"","description":"","badge":"Premium","monthlyPrice":0,"buttonText":"","buttonHref":"/contact","target":"","highlight":false,"featuresText":"f1|f2|f3|f4|f5","restrictionsText":""}],'
    '"faqs":[{"question":"","answer":""},{"question":"","answer":""}],'
    '"offers":[{"title":"","offer_type":"coaching","description":"","price":0,"currency":"","duration":"","slug":""},{"title":"","offer_type":"service","description":"","price":0,"currency":"","duration":"","slug":""}],'
    '"mktHeadline":"","mktSubheadline":"","mktCtaLabel":"","mktCtaHref":"/setup-wizard","mktShowDemo":true,'
    '"mktBullets":["","",""],'
    '"mktFeatureGrid":[{"title":"Build","before":"","after":""},{"title":"Sell","before":"","after":""},{"title":"Deliver","before":"","after":""},{"title":"Grow","before":"","after":""}],'
    '"mktLeadMagnetEnabled":true,"mktLeadMagnetHeadline":"","mktLeadMagnetCta":"",'
    '"mktFinalCtaHeadline":"","mktFinalCtaLabel":""}'
)


def _normalise_json(raw: str) -> dict:
    """Strip fences, fix unicode punctuation, collapse to minified JSON, parse."""
    import json as _json, re as _re
    raw = raw.strip()
    if raw.startswith("```"):
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
    # Collapse pretty-printed then retry
    collapsed = _re.sub(r'\s+', ' ', raw)
    return _json.loads(collapsed)


async def _call_groq_prefill_async(description: str) -> dict:
    """
    Fire two Groq calls in parallel using groq/compound-mini.
    Skeleton A (brand/hero/content, ~30 keys) and B (pricing/offers/marketing, ~16 keys)
    run concurrently via asyncio.gather → total latency ≈ max(A, B) ≈ 8–10s.
    """
    from groq import AsyncGroq
    import asyncio as _asyncio

    aclient = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def _call(skeleton: str, max_tok: int) -> dict:
        resp = await aclient.chat.completions.create(
            model=PREFILL_MODEL,
            messages=[
                {"role": "system", "content": _PREFILL_INSTRUCTION + skeleton},
                {"role": "user",   "content": description},
            ],
            temperature=0.3,
            max_tokens=max_tok,
        )
        return _normalise_json(resp.choices[0].message.content)

    part_a, part_b = await _asyncio.gather(
        _call(_SKELETON_A, 1500),   # brand / hero / features / CTA / footer
        _call(_SKELETON_B, 1000),   # pricing / offers / marketing
    )
    # Merge — part_a wins on collisions (brand identity takes priority)
    return {**part_b, **part_a}


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
    description: str


class PrefillResponse(BaseModel):
    prefill: dict
    saved: bool = False   # True if also persisted to user_site_settings


def _validate_description(description: str) -> str:
    description = description.strip()
    if not description:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="description must not be empty.",
        )
    if len(description) > 2000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="description must be 2000 characters or fewer.",
        )
    return description


@router.post("/chat/prefill", response_model=PrefillResponse)
async def chat_prefill(body: PrefillRequest):
    """
    Generate a comprehensive wizard prefill JSON from a plain-English business description.
    Covers all auto-fillable steps: 1, 4, 5, 6, 7, 8, 9, 10.
    Does NOT save — use /chat/prefill-and-save to also persist to the user's profile.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Genie is not configured yet. Set GROQ_API_KEY in the environment.",
        )

    description = _validate_description(body.description)

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

    return PrefillResponse(prefill=prefill, saved=False)


@router.post("/chat/prefill-and-save", response_model=PrefillResponse)
async def chat_prefill_and_save(
    body: PrefillRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Generate the comprehensive wizard prefill JSON AND save it directly to the
    authenticated user's site settings (user_site_settings table) — same storage
    as completing the wizard manually.

    Requires a valid JWT (Bearer header or cookie).
    Falls back to prefill-only (saved=False) if the user is not authenticated.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Genie is not configured yet. Set GROQ_API_KEY in the environment.",
        )

    description = _validate_description(body.description)

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

    # --- Attempt to save to user profile ---
    user = _get_current_user(request, db)
    if user is None:
        # Not logged in — return prefill without saving
        return PrefillResponse(prefill=prefill, saved=False)

    # Build the settings payload (mirrors buildSetupPayload in the frontend)
    import json as _json
    from app.models.user_site_settings import UserSiteSettings

    def _upsert(key: str, value) -> None:
        row = (
            db.query(UserSiteSettings)
            .filter(UserSiteSettings.user_id == user.id, UserSiteSettings.key == key)
            .first()
        )
        if row:
            row.value = value
        else:
            db.add(UserSiteSettings(user_id=user.id, key=key, value=value))

    p = prefill  # shorthand

    _upsert("brand", {
        "name":        p.get("brandName", ""),
        "tagline":     p.get("tagline", ""),
        "description": p.get("description", ""),
        "year":        str(__import__("datetime").date.today().year),
    })
    _upsert("general", {
        "siteName":        p.get("siteName", p.get("brandName", "")),
        "siteDescription": p.get("siteDescription", ""),
        "timezone":        "Asia/Kolkata",
        "language":        "en",
        "maintenanceMode": False,
        "registrationOpen": True,
        "emailVerification": True,
        "twoFactorRequired": False,
    })
    _upsert("contact", {
        "email":    p.get("contactEmail", ""),
        "phone":    p.get("contactPhone", ""),
        "location": p.get("location", ""),
    })
    _upsert("hero", {
        "badge":         p.get("heroBadge", ""),
        "headline":      p.get("heroHeadline", ""),
        "subheadline":   p.get("heroSubheadline", ""),
        "highlightWord": p.get("heroHighlightWord", ""),
        "cta": {
            "primary":   {"text": p.get("heroPrimaryText", "Get Started"), "href": "/setup-wizard"},
            "secondary": {"text": p.get("heroSecondaryText", ""), "href": p.get("heroSecondaryHref", "")},
        },
    })
    _upsert("stats",     p.get("stats", []))
    _upsert("trustedBy", [s.strip() for s in p.get("trustedBy", "").split(",") if s.strip()])
    _upsert("whyDifferent", {
        "title":    p.get("whyDifferentTitle", ""),
        "subtitle": p.get("whyDifferentSubtitle", ""),
    })
    _upsert("valueProps", p.get("valueProps", []))
    _upsert("features",   p.get("features", []))
    _upsert("cta", {
        "headline":    p.get("ctaHeadline", ""),
        "subheadline": p.get("ctaSubheadline", ""),
        "primary":     {"text": p.get("ctaPrimaryText", ""), "href": p.get("ctaPrimaryHref", "/setup-wizard")},
        "secondary":   {"text": p.get("ctaSecondaryText", ""), "href": p.get("ctaSecondaryHref", "/contact")},
        "badges":      [b for b in [p.get("badge0"), p.get("badge1"), p.get("badge2")] if b],
    })
    _upsert("footerLinks", {
        "platform":  p.get("footerPlatform", []),
        "resources": p.get("footerResources", []),
        "company":   p.get("footerCompany", []),
    })
    _upsert("pricing", {
        "currency":              p.get("currency", "₹"),
        "annualDiscountPercent": 20,
        "studentDiscountPercent": 0,
        "plans": [
            {
                **plan,
                "features":     [f.strip() for f in plan.get("featuresText", "").split("\n") if f.strip()],
                "restrictions": [r.strip() for r in plan.get("restrictionsText", "").split("\n") if r.strip()],
            }
            for plan in p.get("plans", [])
        ],
        "faqs": p.get("faqs", []),
    })
    _upsert("marketing_page", {
        "hero": {
            "headline":      p.get("mktHeadline", ""),
            "subheadline":   p.get("mktSubheadline", ""),
            "cta_label":     p.get("mktCtaLabel", "Start free"),
            "cta_href":      "/setup-wizard",
            "show_live_demo": True,
        },
        "problem_bullets": [b for b in p.get("mktBullets", []) if b],
        "feature_grid":    p.get("mktFeatureGrid", []),
        "lead_magnet": {
            "enabled":   True,
            "headline":  p.get("mktLeadMagnetHeadline", ""),
            "cta_label": p.get("mktLeadMagnetCta", "Send me the guide"),
        },
        "final_cta": {
            "headline":  p.get("mktFinalCtaHeadline", ""),
            "cta_label": p.get("mktFinalCtaLabel", "Start free"),
        },
    })

    try:
        db.commit()
        logger.info("Genie prefill saved to user_site_settings for user_id=%s", user.id)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to save Genie prefill for user %s: %s", user.id, exc)
        # Still return the prefill — the frontend can fall back to sessionStorage
        return PrefillResponse(prefill=prefill, saved=False)

    return PrefillResponse(prefill=prefill, saved=True)
