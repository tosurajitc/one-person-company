"""
genie_routes.py

POST /api/genie/draft-site  — called from the setup wizard Step 1 "AI draft" button.
                              Receives { start: { description, businessType, market, language } }
                              and returns a partial DEFAULT_STATE-shaped dict (schema 2.0)
                              that the wizard deep-merges into its state.

POST /api/genie/intake       — called from the standalone AI Website Builder / Genie
                              intake page (frontend/app/platform/ai-website-builder),
                              replacing that page's old two-endpoint setup
                              (POST /api/chat/prefill for guests, POST
                              /api/chat/prefill-and-save for logged-in users) with one
                              endpoint that checks login status itself.
                              Request (matches the intake page's fetch body exactly):
                                { schemaVersion, start, basics, answers, links,
                                  pastedMaterial, description }
                              Response:
                                { prefill, needsConfirmation, followUps, saved }
                                - prefill: same DEFAULT_STATE-shaped partial dict as
                                  draft-site, so the wizard can deep-merge it the same way
                                - needsConfirmation: dotted paths of business-critical
                                  fields Genie proposed a value for. The intake page
                                  merges this with its own client-side "honesty filter"
                                  flags before showing "Check" badges, so this is a
                                  starting signal, not the only source of truth.
                                - followUps: short questions for any of those same
                                  critical fields Genie could NOT fill in at all
                                - saved: true if the caller was logged in and the draft
                                  was written to user_site_settings (key
                                  "genie_intake_draft"); false for anonymous callers,
                                  matching the old prefill-and-save endpoint's behavior

Both endpoints are thin wrappers around the same Groq prefill machinery used by
/api/chat/prefill (_call_groq_prefill_async), which already turns free text into a
schema 2.0 partial state. /genie/intake composes its several inputs (answers, links,
pasted material) into one text blob and feeds it through the same function, so both
endpoints share one, already-working AI call rather than needing separate prompts.

Phase 1 changes:
  - Cleaned up an inline __import__("json").JSONDecodeError in draft_site's error
    handling; both endpoints now use a normal top-of-file `import json`.
  - Added the new /genie/intake endpoint described above.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user_optional, get_current_user
from app.models.user import User
from app.models.user_site_settings import UserSiteSettings

logger = logging.getLogger(__name__)

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Programmatic defaults applied server-side before saving
# (mirrors applyProgrammaticDefaults in frontend/lib/wizard-schema.js)
# ─────────────────────────────────────────────────────────────────────────────

_DEFAULT_SOCIAL_LINKS: Dict[str, str] = {
    "linkedin": "https://linkedin.com/in/yourprofile",
    "instagram": "https://instagram.com/yourhandle",
    "facebook": "https://facebook.com/yourpage",
    "youtube": "https://youtube.com/@yourchannel",
    "x": "https://x.com/yourhandle",
    "googleBusiness": "",
}

_DEFAULT_INTRO_VIDEO: Dict[str, str] = {
    "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "title": "Watch: How I Can Help You",
}

_DEFAULT_FAQS: List[Dict[str, str]] = [
    {"question": "How do I get started?",
     "answer": "Simply reach out through the contact form or book a free discovery call. I will respond within 1 business day."},
    {"question": "What does the process look like?",
     "answer": "We start with a short call to understand your needs, then I send a fixed proposal. After approval, I deliver the work and walk you through it."},
    {"question": "Do you offer refunds?",
     "answer": "Yes — if you are not satisfied after the first milestone, I will revise the work or issue a refund. See the full refund policy below."},
    {"question": "How long does a typical project take?",
     "answer": "Most engagements are scoped and delivered within 2–4 weeks depending on complexity. The timeline is always agreed upfront."},
    {"question": "Can I contact you outside business hours?",
     "answer": "You can leave a message any time. I check messages during working hours and respond within 1 business day."},
]


import re as _re
from datetime import datetime, timezone as _tz


def _slugify(s: str) -> str:
    s = (s or "").lower()
    s = _re.sub(r"[^\w\s-]", "", s)
    s = _re.sub(r"[\s_-]+", "-", s).strip("-")
    return s


def _num(v: Any) -> Optional[int]:
    if v == "" or v is None:
        return None
    try:
        return int(v)
    except (ValueError, TypeError):
        return None


def _is_blank(v: Any) -> bool:
    """True when a value is effectively empty (empty string, empty list, empty dict, or list of empty strings)."""
    if v is None:
        return True
    if isinstance(v, str):
        return v.strip() == ""
    if isinstance(v, list):
        return len(v) == 0 or all(_is_blank(x) for x in v)
    if isinstance(v, dict):
        return len(v) == 0
    return False


def _rebuild_site_payload(prefill: Dict[str, Any], existing_payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Convert wizard-schema prefill → site_build_payload (what the renderer reads).
    Server-side equivalent of buildSitePayload() in setup-wizard/page.js.
    Always call _apply_programmatic_defaults(prefill) before this.
    """
    d = prefill
    market     = (d.get("start") or {}).get("market", "india")
    currencies = (["INR"] if market == "india" else ["USD"] if market == "global" else ["INR", "USD"])

    tier_order: Dict[str, int] = {"front_door": 1, "core": 2, "recurring": 3}
    raw_tiers = (d.get("offers") or {}).get("tiers") or []
    tiers = []
    for t in raw_tiers:
        if not (t or {}).get("name", "").strip():
            continue
        prices: Dict[str, Optional[int]] = {}
        if "INR" in currencies:
            prices["INR"] = _num(t.get("priceInr"))
        if "USD" in currencies:
            prices["USD"] = _num(t.get("priceUsd"))
        deliverables = t.get("deliverables") or ""
        if isinstance(deliverables, str):
            deliverables = [l.strip() for l in deliverables.split("\n") if l.strip()]
        tiers.append({
            "tier": t["tier"], "order": tier_order.get(t["tier"], 99),
            "name": t["name"].strip(), "slug": _slugify(t["name"]),
            "summary": t.get("summary") or "", "deliverables": deliverables,
            "duration": t.get("duration") or "",
            "billing": "monthly" if t["tier"] == "recurring" else "one_time",
            "prices": prices,
            "highlight": (d.get("offers") or {}).get("mostBought") == t["tier"],
        })

    pos = d.get("positioning") or {}
    sentence = (
        f"I help {pos.get('buyer', '')} who struggle with {pos.get('problem', '')} "
        f"to get {pos.get('outcome', '')}"
        + (f" within {pos['timeframe']}" if pos.get("timeframe") else "")
        + (f", without {pos['fear']}" if pos.get("fear") else "") + "."
    )

    identity     = d.get("identity")  or {}
    knowledge    = d.get("knowledge") or {}
    brand        = d.get("brand")     or {}
    proof        = d.get("proof")     or {}
    agents       = d.get("agents")    or {}
    payments_raw = d.get("payments")  or {}
    site_cfg     = d.get("site")      or {}
    start        = d.get("start")     or {}
    fd_raw       = d.get("frontDoor") or {}
    ch           = d.get("channels")  or {}

    slug   = site_cfg.get("subdomain") or _slugify(identity.get("brandName") or "")
    social = {k: v for k, v in (ch.get("social") or {}).items() if v and str(v).strip()}
    faqs   = [f for f in (knowledge.get("faqs") or []) if isinstance(f, dict) and f.get("question") and f.get("answer")]
    created_at = (existing_payload or {}).get("createdAt") or datetime.now(_tz.utc).isoformat()

    return {
        "schemaVersion": "2.0", "template": "opc-template-v1", "createdAt": created_at,
        "site": {
            "subdomain": slug, "customDomain": site_cfg.get("customDomain") or None,
            "language": start.get("language", "en"), "market": market,
            "currencies": currencies, "timezone": identity.get("timezone") or "Asia/Kolkata",
            "notifyEmail": site_cfg.get("notifyEmail") or identity.get("email") or "",
            "analyticsId": site_cfg.get("analyticsId") or None,
            "pages": ["/", "/offers", "/offers/:tier", "/about", "/work",
                      "/insights", "/faq", "/contact", "/legal/*"],
        },
        "business": {
            "description": start.get("description") or "",
            "type": start.get("businessType") or "consulting",
            "brandName": identity.get("brandName") or "",
            "tagline": identity.get("tagline") or None,
            "logoUrl": identity.get("logoUrl") or None,
            "city": identity.get("city") or "", "country": identity.get("country") or "India",
            "owner": {
                "name": identity.get("ownerName") or "", "role": identity.get("ownerRole") or "",
                "photoUrl": identity.get("photoUrl") or None,
                "email": identity.get("email") or "", "whatsapp": identity.get("whatsapp") or "",
            },
        },
        "positioning": {
            "sentence": sentence, "buyer": pos.get("buyer") or "",
            "problem": pos.get("problem") or "", "outcome": pos.get("outcome") or "",
            "timeframe": pos.get("timeframe") or "", "fear": pos.get("fear") or "",
            "alreadyTried": pos.get("alreadyTried") or "", "credibility": pos.get("credibility") or "",
            "forWho": [s for s in (pos.get("forWho") or []) if s],
            "notFor":  [s for s in (pos.get("notFor")  or []) if s],
            "nicheScore": pos.get("nicheScore") or {},
        },
        "offers": {
            "tiers": tiers, "product": None,
            "paymentTerms":   (d.get("offers") or {}).get("paymentTerms") or "50_50",
            "revisionRounds": (d.get("offers") or {}).get("revisionRounds") or "2",
            "priceDisplay":   (d.get("offers") or {}).get("priceDisplay") or "show",
        },
        "proof": {
            "yearsExperience": _num(proof.get("yearsExperience")),
            "clientsServed":   _num(proof.get("clientsServed")),
            "credentials":  [c for c in (proof.get("credentials") or []) if c and isinstance(c, str)],
            "results":      [r for r in (proof.get("results") or []) if isinstance(r, dict) and r.get("number") and r.get("label")],
            "caseStudies":  [c for c in (proof.get("caseStudies") or []) if isinstance(c, dict) and (c.get("client") or c.get("result"))],
            "testimonials": [t for t in (proof.get("testimonials") or []) if isinstance(t, dict) and t.get("name") and t.get("quote")],
        },
        "frontDoor": {
            "primaryAction": fd_raw.get("primaryCta") or "book_call",
            "bookingUrl": fd_raw.get("bookingUrl") or None,
            "buttonLabel": fd_raw.get("ctaLabel") or None,
            "invitation": fd_raw.get("invitation") or "",
            "responseTime": fd_raw.get("responseTime") or "Within 1 business day",
            "workingHours": fd_raw.get("workingHours") or "",
            "channels": fd_raw.get("channels") or {"form": True, "whatsapp": True, "email": True, "booking": True},
            "formQuestions": [q for q in (fd_raw.get("formQuestions") or []) if q],
        },
        "knowledge": {
            "process":     [s for s in (knowledge.get("process") or []) if isinstance(s, dict) and s.get("title")],
            "included":    [s for s in (knowledge.get("included") or []) if s],
            "notIncluded": [s for s in (knowledge.get("notIncluded") or []) if s],
            "refundPolicy": knowledge.get("refundPolicy") or None,
            "toolsUsed":   knowledge.get("toolsUsed") or "",
            "faqs":        faqs,
            "introVideo":  knowledge.get("introVideo") or {"url": "", "title": ""},
        },
        "brand": {
            "style": brand.get("style") or "minimal", "tone": brand.get("tone") or "plain",
            "primaryColor": brand.get("primaryColor") or "#2563eb",
            "referenceSite": brand.get("referenceSite") or None,
            "avoidWords": [w.strip() for w in (brand.get("avoidWords") or "").split(",") if isinstance(brand.get("avoidWords"), str) and w.strip()],
        },
        "agents": {
            "enabled": agents.get("enabled") or [], "autonomy": agents.get("autonomy") or "draft_only",
            "guardrails": agents.get("guardrails") or {},
            "monthlySpendCap": _num(agents.get("monthlySpendCap")),
            "facebook": agents.get("facebook") or {},
        },
        "payments": {
            "gateways": payments_raw.get("gateways") or [],
            "structure": payments_raw.get("structure") or "sole_proprietor",
            "legalName": payments_raw.get("legalName") or identity.get("brandName") or "",
            "gstRegistered": payments_raw.get("gstRegistered") or "no",
            "gstin": payments_raw.get("gstin") if payments_raw.get("gstRegistered") == "yes" else None,
            "exportClients": payments_raw.get("exportClients") == "yes",
            "lutFiled": payments_raw.get("lutFiled") if payments_raw.get("exportClients") == "yes" else None,
            "invoicePrefix": payments_raw.get("invoicePrefix") or "INV-",
            "legalPages": payments_raw.get("legalPages") or {"terms": True, "privacy": True, "refund": True},
        },
        "channels": {
            "social": social,
            "mainPlatform": ch.get("mainPlatform") or "linkedin",
            "cadence": ch.get("cadence") or "weekly",
            "newsletter": bool(ch.get("newsletter")),
            "contentTopics": [t for t in (ch.get("contentTopics") or []) if t],
            "publishedWork": [w for w in (ch.get("publishedWork") or []) if isinstance(w, dict) and w.get("title") and w.get("url")],
        },
        "generation": {
            "writeCopyFor": ["hero", "tagline_if_empty", "about", "offer_pages",
                             "faq_additions", "cta_label_if_empty", "legal_drafts", "meta_seo"],
            "rules": [
                "Build every page around positioning.sentence.",
                "Use only prices from offers. Never invent, round or convert prices.",
                "Never invent statistics, clients, testimonials, credentials or logos.",
                "Hide any proof section that has no data instead of filling it.",
                "End each page with frontDoor.invitation and the primary action.",
                "Never promise delivery dates or availability beyond what is stated.",
                "Avoid every word in brand.avoidWords.",
                "Mark legal pages as drafts that need professional review.",
            ],
        },
    }


def _apply_programmatic_defaults(prefill: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply server-side programmatic defaults to a Genie-generated prefill.
    These cover fields the LLM cannot (or must not) generate: social media URLs,
    YouTube intro video, FAQ section, and other "never blank" fields.

    Any non-blank LLM-generated or user-supplied value is preserved.
    """
    import copy
    out = copy.deepcopy(prefill)

    # ── 1. Social media links ────────────────────────────────────────────────
    social = (out.get("channels") or {}).get("social") or {}
    changed = False
    for platform, placeholder in _DEFAULT_SOCIAL_LINKS.items():
        if _is_blank(social.get(platform)) and placeholder:
            social[platform] = placeholder
            changed = True
    if changed:
        if "channels" not in out or not isinstance(out["channels"], dict):
            out["channels"] = {}
        out["channels"]["social"] = social

    # ── 2. YouTube intro video ───────────────────────────────────────────────
    knowledge = out.get("knowledge") or {}
    intro = knowledge.get("introVideo") or {}
    if _is_blank(intro.get("url")):
        knowledge["introVideo"] = {
            "url": _DEFAULT_INTRO_VIDEO["url"],
            "title": intro.get("title") or _DEFAULT_INTRO_VIDEO["title"],
        }
        out["knowledge"] = knowledge

    # ── 3. FAQ section — never blank ────────────────────────────────────────
    faqs = knowledge.get("faqs") or []
    valid_faqs = [f for f in faqs if f and f.get("question") and f.get("answer")]
    if len(valid_faqs) == 0:
        knowledge["faqs"] = _DEFAULT_FAQS
        out["knowledge"] = knowledge

    # ── 4. Process steps — fill blank details ───────────────────────────────
    process = knowledge.get("process") or []
    if len(process) == 0:
        knowledge["process"] = [
            {"title": "Discovery call", "detail": "A short free call to understand your needs and goals."},
            {"title": "Proposal", "detail": "A fixed-scope written proposal with timeline and price."},
            {"title": "Delivery", "detail": "I do the work and keep you updated throughout."},
            {"title": "Handover", "detail": "I walk you through everything and answer your questions."},
        ]
        out["knowledge"] = knowledge
    else:
        for step in process:
            if _is_blank(step.get("detail")):
                step["detail"] = "We complete this step together efficiently."
        out["knowledge"] = knowledge

    # ── 5. CTA label ─────────────────────────────────────────────────────────
    front_door = out.get("frontDoor") or {}
    if _is_blank(front_door.get("ctaLabel")):
        cta_labels = {
            "book_call": "Book a Free Call",
            "whatsapp": "Message on WhatsApp",
            "form": "Get in Touch",
            "email": "Email Me",
        }
        cta = front_door.get("primaryCta") or "book_call"
        front_door["ctaLabel"] = cta_labels.get(cta, "Get in Touch")
        out["frontDoor"] = front_door

    # ── 6. Invitation ────────────────────────────────────────────────────────
    if _is_blank(front_door.get("invitation")):
        front_door["invitation"] = "Ready to get started? Reach out and I'll respond within 1 business day."
        out["frontDoor"] = front_door

    # ── 7. Refund policy ─────────────────────────────────────────────────────
    if _is_blank(knowledge.get("refundPolicy")):
        knowledge["refundPolicy"] = (
            "If you are not satisfied after the first milestone, I will revise the work "
            "or provide a full refund — no questions asked."
        )
        out["knowledge"] = knowledge

    # ── 8. included / notIncluded ────────────────────────────────────────────
    included = [s for s in (knowledge.get("included") or []) if not _is_blank(s)]
    if len(included) == 0:
        knowledge["included"] = ["All work as described in the proposal", "Regular progress updates", "Final walkthrough and handover"]
        out["knowledge"] = knowledge
    not_included = [s for s in (knowledge.get("notIncluded") or []) if not _is_blank(s)]
    if len(not_included) == 0:
        knowledge["notIncluded"] = ["Ongoing maintenance unless specified", "Third-party tool costs"]
        out["knowledge"] = knowledge

    return out


# ---------------------------------------------------------------------------
# Schemas — /genie/draft-site
# ---------------------------------------------------------------------------

class DraftSiteRequest(BaseModel):
    """Sent by the wizard's handleAiDraft() — just the Step 1 'start' group."""
    start: Dict[str, Any] = {}


# The wizard calls deepMerge(DEFAULT_STATE, draft) directly on the JSON response,
# so the response body must BE the partial state dict, not a wrapper around it.
DraftSiteResponse = Dict[str, Any]


# ---------------------------------------------------------------------------
# Schemas — /genie/intake
# ---------------------------------------------------------------------------

class IntakeRequest(BaseModel):
    """
    Matches the AI Website Builder intake page's fetch body exactly (see its
    own API CONTRACT comment). answers is a free-form {question_key: answer}
    map -- the page's QUESTIONS array currently uses keys like whatAndWho,
    problem, result, offersAndPrices, whyYou, notFit, howFound, but the
    backend does not hardcode those so a future question-wording change on
    the frontend does not require a matching backend change.
    """
    schemaVersion: str = "2.0"
    start: Dict[str, Any] = {}
    basics: Dict[str, Any] = {}
    answers: Dict[str, str] = {}
    links: Dict[str, str] = {}     # {"website": "...", "linkedin": "...", ...}
    pastedMaterial: str = ""
    description: str = ""          # pre-composed by the page from a few key answers


class IntakeResponse(BaseModel):
    prefill: Dict[str, Any]
    needsConfirmation: List[str]
    followUps: List[str]
    saved: bool = False
    is_cached_draft: bool = False
    remaining_credits: int = 0
    generations_count: int = 0


# A handful of business-critical fields, matched to the wizard's own required-field
# checks (see page.js's reqIssues()). Deliberately a small, fixed list rather than
# scanning the whole prefill tree: these are the fields a wrong AI guess would hurt
# most, so they always get a "please confirm" badge if Genie filled them, and a
# direct follow-up question if Genie could not fill them at all.
_CRITICAL_FIELDS: List[Tuple[str, str]] = [
    ("positioning.buyer", "Who do you help?"),
    ("positioning.problem", "What problem do you solve for them?"),
    ("positioning.outcome", "What outcome do they get from working with you?"),
    ("offers.tiers.0.name", "What's the name of your main offer or service?"),
]


def _get_nested(data: Dict[str, Any], dotted_path: str) -> Any:
    """Read a dotted path like 'offers.tiers.0.name' out of a nested dict/list."""
    current: Any = data
    for part in dotted_path.split("."):
        if isinstance(current, list):
            try:
                index = int(part)
            except ValueError:
                return None
            if index < 0 or index >= len(current):
                return None
            current = current[index]
        elif isinstance(current, dict):
            current = current.get(part)
        else:
            return None
    return current


def _compose_intake_text(body: IntakeRequest) -> str:
    """Turn the intake page's several inputs into one text blob for the Groq call."""
    lines: List[str] = []

    business_type = (body.start.get("businessType") or "").strip()
    market = (body.start.get("market") or "").strip()
    if business_type or market:
        lines.append(f"Business type: {business_type}. Market: {market}.")

    for question, answer in body.answers.items():
        answer = (answer or "").strip()
        if answer:
            lines.append(f"{question}: {answer}")

    link_values = [v.strip() for v in body.links.values() if v and v.strip()]
    if link_values:
        lines.append("Links provided: " + ", ".join(link_values))

    pasted = (body.pastedMaterial or "").strip()
    if pasted:
        lines.append("Additional material:\n" + pasted)

    return "\n".join(lines)


def _save_intake_draft(db: Session, user_id: int, prefill: Dict[str, Any], basics: Dict[str, Any]) -> None:
    """
    Upsert the drafted prefill into user_site_settings for a logged-in caller.

    basics (ownerName, brandName, email, whatsapp) are typed directly by the user
    on the intake form and are never generated by the AI, so they must be merged
    into identity before saving.  Only non-empty basics fields are applied.

    Programmatic defaults (social links, YouTube, FAQs, etc.) are also applied so
    the saved draft is always a complete website even before save-wizard is called.
    """
    # Map non-empty basics fields into identity, same keys the intake form uses
    BASICS_TO_IDENTITY = ("ownerName", "brandName", "email", "whatsapp")
    identity: Dict[str, Any] = dict(prefill.get("identity") or {})
    for field in BASICS_TO_IDENTITY:
        value = (basics.get(field) or "").strip()
        if value:
            identity[field] = value
    to_save = {**prefill, "identity": identity}

    # Apply programmatic defaults so the draft is always a complete site
    to_save = _apply_programmatic_defaults(to_save)

    row = (
        db.query(UserSiteSettings)
        .filter(UserSiteSettings.user_id == user_id, UserSiteSettings.key == "genie_intake_draft")
        .first()
    )
    if row:
        row.value = to_save
        row.schema_version = "2.0"
    else:
        db.add(UserSiteSettings(user_id=user_id, key="genie_intake_draft", value=to_save, schema_version="2.0"))


def _confirmation_and_followups(prefill: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    """
    Split _CRITICAL_FIELDS into two lists based on whether Genie filled each one:
    filled -> needs the founder's confirmation; empty -> becomes a follow-up question.
    """
    needs_confirmation: List[str] = []
    follow_ups: List[str] = []
    for path, question in _CRITICAL_FIELDS:
        value = _get_nested(prefill, path)
        if isinstance(value, str) and value.strip():
            needs_confirmation.append(path)
        elif value not in (None, "", [], {}):
            needs_confirmation.append(path)
        else:
            follow_ups.append(question)
    return needs_confirmation, follow_ups


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/genie/draft-site")
async def draft_site(
    body: DraftSiteRequest,
    request: Request,
):
    """
    Generate a partial wizard state (schema 2.0) from the Step 1 description.
    Called by handleAiDraft() inside the setup wizard.

    Only fills fields the user hasn't yet typed — the wizard merges this on top
    of its existing state using preferUserInput().
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Genie is not configured yet. Set GROQ_API_KEY in the environment.",
        )

    description = (body.start.get("description") or "").strip()
    if not description:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start.description is required.",
        )
    if len(description) > 4000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start.description must be 4000 characters or fewer.",
        )

    # Reuse the same async parallel Groq machinery as the /chat/prefill endpoint
    try:
        from app.api.routes.chat_routes import _call_groq_prefill_async
        draft = await _call_groq_prefill_async(description)
    except json.JSONDecodeError as exc:
        logger.error("draft-site JSON parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Genie returned malformed data. Try a longer description.",
        )
    except Exception as exc:
        logger.error("draft-site Groq error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Genie is temporarily unavailable. Your progress is saved; continue manually.",
        )

    # Merge the caller's start values on top — user input always wins
    draft_start = draft.get("start", {})
    for k, v in body.start.items():
        if v and k != "description":   # description already consumed above
            draft_start[k] = v
    draft_start["description"] = description
    draft["start"] = draft_start

    return draft


@router.get("/genie/status")
async def genie_status(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Returns AI Website Builder generation quota status and cached draft if available."""
    if not current_user:
        return {
            "is_logged_in": False,
            "has_saved_draft": False,
            "generations_count": 0,
            "credits": 0,
            "free_generation_available": True,
        }

    # Check for existing saved draft
    draft_row = (
        db.query(UserSiteSettings)
        .filter(UserSiteSettings.user_id == current_user.id, UserSiteSettings.key == "genie_intake_draft")
        .first()
    )
    count = current_user.ai_generations_count or 0
    credits = current_user.ai_generation_credits or 0
    free_available = count == 0 or current_user.is_admin()

    return {
        "is_logged_in": True,
        "has_saved_draft": draft_row is not None and bool(draft_row.value),
        "saved_draft": draft_row.value if draft_row else None,
        "generations_count": count,
        "credits": credits,
        "free_generation_available": free_available,
        "can_generate": free_available or credits > 0,
    }


@router.post("/genie/intake", response_model=IntakeResponse)
async def intake(
    body: IntakeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate a partial wizard state from the AI Website Builder intake page's
    question set, links, and pasted material.

    Token & Quota rules:
    - First generation is 100% FREE for every user.
    - If free generation was already used and user has no paid credits (Rs. 99),
      returns HTTP 402 Payment Required with saved draft context.
    - Increments ai_generations_count and decrements paid credit upon execution.
    """
    # Enforce quota check for logged in users
    if current_user is not None and not current_user.is_admin():
        count = current_user.ai_generations_count or 0
        credits = current_user.ai_generation_credits or 0
        if count > 0 and credits <= 0:
            # Check if they have a saved draft to return
            draft_row = (
                db.query(UserSiteSettings)
                .filter(UserSiteSettings.user_id == current_user.id, UserSiteSettings.key == "genie_intake_draft")
                .first()
            )
            saved_draft = draft_row.value if (draft_row and draft_row.value) else {}
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "message": "You have used your 1 free AI website draft. You can continue customizing your draft for free in the wizard, or get a new AI generation for Rs. 99.",
                    "code": "QUOTA_EXHAUSTED",
                    "price_inr": 99,
                    "has_saved_draft": bool(saved_draft),
                    "saved_draft": saved_draft,
                },
            )

    if not settings.GROQ_API_KEY and not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Genie is not configured yet. Please configure GROQ_API_KEY or ANTHROPIC_API_KEY.",
        )

    composed_text = _compose_intake_text(body)
    if not composed_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one answer, link, or piece of pasted material is required.",
        )
    if len(composed_text) > 8000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Combined intake input must be 8000 characters or fewer.",
        )

    try:
        from app.api.routes.chat_routes import _call_groq_prefill_async
        prefill = await _call_groq_prefill_async(composed_text)
    except json.JSONDecodeError as exc:
        logger.error("intake JSON parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Genie returned malformed data. Try adding more detail.",
        )
    except Exception as exc:
        logger.error("intake Groq error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Genie is temporarily unavailable. Try the manual setup wizard instead.",
        )

    needs_confirmation, follow_ups = _confirmation_and_followups(prefill)

    saved = False
    remaining_credits = 0
    generations_count = 0
    if current_user is not None:
        try:
            _save_intake_draft(db, current_user.id, prefill, body.basics)
            # Update user generation counts and credits
            current_user.ai_generations_count = (current_user.ai_generations_count or 0) + 1
            if (current_user.ai_generations_count or 0) > 1 and (current_user.ai_generation_credits or 0) > 0:
                current_user.ai_generation_credits = max(0, (current_user.ai_generation_credits or 0) - 1)
            db.commit()
            db.refresh(current_user)
            saved = True
            remaining_credits = current_user.ai_generation_credits or 0
            generations_count = current_user.ai_generations_count or 0
        except Exception as exc:
            db.rollback()
            logger.error("Failed to save genie intake draft for user %s: %s", current_user.id, exc)

    return IntakeResponse(
        prefill=prefill,
        needsConfirmation=needs_confirmation,
        followUps=follow_ups,
        saved=saved,
        is_cached_draft=False,
        remaining_credits=remaining_credits,
        generations_count=generations_count,
    )


# ---------------------------------------------------------------------------
# /genie/save-wizard — save a complete, AI-generated wizard state directly
# ---------------------------------------------------------------------------
# Called from the AI Website Builder after Genie generates the prefill.
# Applies programmatic defaults (social links, YouTube, FAQs, etc.) server-side,
# then saves each domain group to user_site_settings — so the user never
# needs to go through the 13-step setup wizard.
# The user can still edit any field later from /platform/my-website.

class SaveWizardRequest(BaseModel):
    """
    The complete Genie-generated prefill (schema 2.0 partial wizard state)
    plus the user's raw intake basics and start values that always win.

    prefill         — the full LLM output after client-side honesty filtering
    basics          — { ownerName, brandName, email, whatsapp } typed by the user
    start           — { businessType, market, language } chosen by the user
    userSocialLinks — { linkedin, instagram } supplied in the intake links section
    """
    prefill: Dict[str, Any] = {}
    basics: Dict[str, Any] = {}
    start: Dict[str, Any] = {}
    userSocialLinks: Dict[str, str] = {}


class SaveWizardResponse(BaseModel):
    success: bool
    message: str = ""


@router.post("/genie/save-wizard", response_model=SaveWizardResponse)
async def save_wizard(
    body: SaveWizardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Accept the AI-generated wizard state and save it directly to user_site_settings
    without requiring the user to step through the setup wizard.

    Steps:
    1. Merge user basics (name, email, etc.) into identity — user input always wins.
    2. Merge user start (businessType, market, language) — user input always wins.
    3. Merge user-supplied social links — user input always wins.
    4. Apply programmatic defaults (social placeholders, YouTube, FAQs, process,
       CTA label, invitation, refund policy, included/notIncluded).
    5. Persist each v2 domain group to user_site_settings.
    6. Update genie_intake_draft with the final merged state.
    """
    prefill: Dict[str, Any] = dict(body.prefill)

    # ── 1. Merge user basics into identity ───────────────────────────────────
    BASICS_TO_IDENTITY = ("ownerName", "brandName", "email", "whatsapp")
    identity: Dict[str, Any] = dict(prefill.get("identity") or {})
    for field in BASICS_TO_IDENTITY:
        value = (body.basics.get(field) or "").strip()
        if value:
            identity[field] = value
    # Fall back to auth user's profile values for any still-blank identity fields
    if not identity.get("ownerName") and current_user.full_name:
        identity["ownerName"] = current_user.full_name
    if not identity.get("email") and current_user.email:
        identity["email"] = current_user.email
    prefill["identity"] = identity

    # ── 2. Merge user start values ───────────────────────────────────────────
    if body.start:
        existing_start = dict(prefill.get("start") or {})
        for k, v in body.start.items():
            if v:
                existing_start[k] = v
        prefill["start"] = existing_start

    # ── 3. Merge user-supplied social links ──────────────────────────────────
    if body.userSocialLinks:
        channels = dict(prefill.get("channels") or {})
        social = dict(channels.get("social") or {})
        for platform, url in body.userSocialLinks.items():
            if url and url.strip():
                social[platform] = url.strip()
        channels["social"] = social
        prefill["channels"] = channels

    # ── 4. Apply programmatic defaults ──────────────────────────────────────
    prefill = _apply_programmatic_defaults(prefill)

    # ── 5. Persist each domain group to user_site_settings ──────────────────
    V2_GROUPS = ("start", "identity", "positioning", "offers", "proof",
                 "frontDoor", "knowledge", "brand", "agents", "payments",
                 "channels", "site")

    def _upsert(key: str, value: Any) -> None:
        row = (
            db.query(UserSiteSettings)
            .filter(UserSiteSettings.user_id == current_user.id, UserSiteSettings.key == key)
            .first()
        )
        if row:
            row.value = value
            row.schema_version = "2.0"
        else:
            db.add(UserSiteSettings(user_id=current_user.id, key=key, value=value, schema_version="2.0"))

    try:
        for group_key in V2_GROUPS:
            if group_key in prefill:
                _upsert(group_key, prefill[group_key])

        # ── 6. Update genie_intake_draft with the final merged state
        _upsert("genie_intake_draft", prefill)

        # ── 7. Rebuild site_build_payload so /[username] renders immediately ─
        # Read existing payload to preserve createdAt
        existing_payload_row = (
            db.query(UserSiteSettings)
            .filter(UserSiteSettings.user_id == current_user.id, UserSiteSettings.key == "site_build_payload")
            .first()
        )
        existing_payload = existing_payload_row.value if existing_payload_row else None
        site_payload = _rebuild_site_payload(prefill, existing_payload)
        _upsert("site_build_payload", site_payload)

        db.commit()
        logger.info("Genie save-wizard: saved all groups + site_build_payload for user_id=%s", current_user.id)
    except Exception as exc:
        db.rollback()
        logger.error("save-wizard failed for user %s: %s", current_user.id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save your website data. Please try again.",
        )

    return SaveWizardResponse(
        success=True,
        message="Your website data has been saved. You can edit it anytime from your dashboard.",
    )
