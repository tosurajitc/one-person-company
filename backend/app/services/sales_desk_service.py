"""
sales_desk_service.py

Handles automated lead qualification and grounded response drafting
for inbound enquiries based on the founder's actual offers and business positioning.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enquiry import Enquiry, EnquiryStatus
from app.models.offer import Offer
from app.models.user_site_settings import UserSiteSettings

logger = logging.getLogger(__name__)


def _get_founder_context(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Retrieve the founder's site settings, positioning, brand name, and published offers.
    """
    # 1. Offers
    offers = db.query(Offer).filter(Offer.creator_id == user_id, Offer.is_active == True).all()
    offers_data = []
    for o in offers:
        offers_data.append({
            "title": o.title,
            "tier": o.tier,
            "price": o.price,
            "currency": o.currency,
            "price_usd": o.price_usd,
            "deliverables": o.deliverables or o.features or [],
            "description": o.description,
            "type": o.type.value if hasattr(o.type, "value") else str(o.type),
        })

    # 2. Site Settings / Wizard Payload
    settings_row = (
        db.query(UserSiteSettings)
        .filter(UserSiteSettings.user_id == user_id, UserSiteSettings.key == "site_build_payload")
        .first()
    )
    payload = settings_row.value if settings_row and isinstance(settings_row.value, dict) else {}

    brand_name = payload.get("identity", {}).get("brandName") or payload.get("business", {}).get("name") or "Our Company"
    founder_name = payload.get("identity", {}).get("founderName") or "Founder"
    positioning = payload.get("positioning", {})

    return {
        "brand_name": brand_name,
        "founder_name": founder_name,
        "positioning": positioning,
        "offers": offers_data,
        "full_payload": payload,
    }


def qualify_and_draft_reply(
    db: Session,
    enquiry: Enquiry,
    custom_instructions: Optional[str] = None,
) -> Tuple[str, str, str]:
    """
    Calls Groq (or lightweight deterministic fallback) to qualify the enquiry
    and write a polite, high-converting draft reply strictly referencing verified offers.
    Returns: (qualification_summary, matched_offer_name, draft_reply)
    """
    if not enquiry.user_id:
        return ("Unassigned enquiry", "", "Thank you for reaching out. We will get back to you shortly.")

    ctx = _get_founder_context(db, enquiry.user_id)

    system_prompt = f"""You are the Executive Sales Assistant for {ctx['founder_name']} ({ctx['brand_name']}).
Your job is to analyze an incoming prospective client enquiry, determine the best matching service/offer, and write a high-converting, warm, professional email draft for {ctx['founder_name']} to review and send.

FOUNDER BUSINESS CONTEXT:
- Brand Name: {ctx['brand_name']}
- Founder Name: {ctx['founder_name']}
- Positioning / Target Audience: {json.dumps(ctx['positioning'])}
- Active Offers & Pricing:
{json.dumps(ctx['offers'], indent=2)}

RULES:
1. Grounding: Do NOT invent discounts, prices, or deliverables that do not exist in the active offers.
2. Tone: Warm, confident, consultative, concise.
3. Structure:
   - Thank them by name.
   - Acknowledge their specific requirement or project goal.
   - Propose the most relevant tier/offer and explain why it fits.
   - Include a clear, low-friction next step (e.g. quick 15-min discovery call or answering specific questions).
4. Return a valid JSON object with keys:
   - "qualification": A 1-2 sentence internal note explaining lead fit, intent, and estimated budget/urgency.
   - "matched_offer": The title of the offer that best matches the lead.
   - "draft_reply": The complete email draft (including greeting and sign-off from {ctx['founder_name']}).
"""

    user_prompt = f"""INCOMING ENQUIRY:
Lead Name: {enquiry.name}
Lead Email: {enquiry.email}
Lead Phone: {enquiry.phone or 'Not provided'}
Source/Type: {enquiry.source or 'Website'}
Enquiry Message: {enquiry.message}
Extra Info: {json.dumps(enquiry.extra_data or {})}
{f'Founder Custom Note: {custom_instructions}' if custom_instructions else ''}

Generate the JSON response."""

    # If Groq is available, call it
    if settings.GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            resp = client.chat.completions.create(
                model=getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=1024,
            )
            raw = resp.choices[0].message.content or "{}"
            parsed = json.loads(raw)

            # Deduct wallet usage for founder if available
            if hasattr(resp, "usage") and resp.usage and enquiry.user_id:
                used_tokens = getattr(resp.usage, "total_tokens", 0) or 0
                if used_tokens > 0:
                    from app.models.user import User
                    user_row = db.query(User).filter(User.id == enquiry.user_id).first()
                    if user_row:
                        user_row.ai_tokens_used = (user_row.ai_tokens_used or 0) + used_tokens
                        rate = getattr(settings, "INR_PER_1K_TOKENS", 0.15)
                        cost_inr = round((used_tokens / 1000.0) * rate, 4)
                        user_row.wallet_consumed = float(user_row.wallet_consumed or 0.0) + cost_inr
                        user_row.wallet_balance = max(0.0, float(user_row.wallet_balance or 0.0) - cost_inr)
                        db.commit()

            return (
                parsed.get("qualification", "Good potential client enquiry."),
                parsed.get("matched_offer", ctx["offers"][0]["title"] if ctx["offers"] else "Standard Consultation"),
                parsed.get("draft_reply", ""),
            )
        except Exception as e:
            logger.warning(f"Groq sales agent failed: {e}. Falling back to template draft.")

    # Fallback template draft
    best_offer = ctx["offers"][0]["title"] if ctx["offers"] else "custom service"
    price_str = f" starting at {ctx['offers'][0]['currency']} {ctx['offers'][0]['price']}" if ctx["offers"] and ctx["offers"][0].get("price") else ""
    
    qualification = f"Inbound lead interested in {enquiry.source or 'consulting'}. Matched with {best_offer}."
    draft_reply = (
        f"Hi {enquiry.name},\n\n"
        f"Thank you for reaching out to {ctx['brand_name']}.\n\n"
        f"I reviewed your note regarding your project: \"{enquiry.message[:120]}...\". "
        f"Our {best_offer}{price_str} would be an ideal fit for your goals.\n\n"
        f"Would you be available for a brief 15-minute discovery call this week to align on the scope and timeline?\n\n"
        f"Best regards,\n"
        f"{ctx['founder_name']}\n"
        f"{ctx['brand_name']}"
    )
    return (qualification, best_offer, draft_reply)
