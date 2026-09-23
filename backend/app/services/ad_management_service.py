"""
ad_management_service.py

AI Agent Orchestrator & State Manager for the Autonomous Ad Management Suite.
Supports BYOK (Bring Your Own Key) for Groq, Anthropic, OpenAI, OpenRouter, and Platform default.
Implements 100% human-in-the-loop state transitions (DRAFT -> VERIFIED -> APPLIED).
"""

from __future__ import annotations
import json
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.crypto import decrypt_secret
from app.models.user_ai_credential import UserAiCredential, AiProviderType
from app.models.ad_management_state import AdManagementState, StepVerificationStatus
from app.models.user import User

logger = logging.getLogger(__name__)


# ── BYOK Resolution & Unified AI Calling ───────────────────────────────────

def get_user_ai_client(db: Session, user_id: int) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Resolves the user's active AI provider, decrypted API key, and model name.
    Returns: (provider_str, decrypted_api_key_or_none, model_name_or_none)
    """
    cred = db.query(UserAiCredential).filter(UserAiCredential.user_id == user_id, UserAiCredential.is_active == True).first()
    if cred and cred.provider != AiProviderType.PLATFORM and cred.encrypted_api_key:
        try:
            plain_key = decrypt_secret(cred.encrypted_api_key)
            provider_str = cred.provider.value if hasattr(cred.provider, "value") else str(cred.provider)
            return provider_str, plain_key, cred.custom_model_name
        except Exception as e:
            logger.warning(f"Failed to decrypt custom BYOK key for user {user_id}: {e}. Falling back to platform default.")

    # Platform default fallback
    return "platform", None, None


def call_ai_chat_json(
    db: Session,
    user_id: int,
    system_prompt: str,
    user_prompt: str,
    default_fallback: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Unified JSON chat completion caller across Groq, Anthropic, OpenAI, OpenRouter, and platform.
    Tracks token deduction with provider-specific pricing if platform credits are consumed.
    """
    provider, api_key, custom_model = get_user_ai_client(db, user_id)
    raw_response = None
    tokens_used = 0
    active_provider_for_billing = provider  # tracks which provider actually fired

    try:
        if provider == "groq" and api_key:
            from groq import Groq
            client = Groq(api_key=api_key)
            model = custom_model or "llama-3.3-70b-versatile"
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt + "\nRespond ONLY with valid JSON."},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            raw_response = resp.choices[0].message.content

        elif provider == "openai" and api_key:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            model = custom_model or "gpt-4o-mini"
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt + "\nRespond ONLY with valid JSON."},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            raw_response = resp.choices[0].message.content

        elif provider == "anthropic" and api_key:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            model = custom_model or "claude-3-5-sonnet-20241022"
            resp = client.messages.create(
                model=model,
                max_tokens=2048,
                system=system_prompt + "\nRespond ONLY with a valid JSON object. Do not include markdown codeblocks or preamble.",
                messages=[{"role": "user", "content": user_prompt}],
            )
            raw_response = resp.content[0].text if resp.content else "{}"

        elif provider == "openrouter" and api_key:
            from openai import OpenAI
            client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
            model = custom_model or "meta-llama/llama-3.3-70b-instruct"
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt + "\nRespond ONLY with valid JSON."},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            raw_response = resp.choices[0].message.content

        else:
            # Platform default: Try settings.GROQ_API_KEY then settings.OPENAI_API_KEY / ANTHROPIC_API_KEY
            if getattr(settings, "GROQ_API_KEY", None):
                from groq import Groq
                client = Groq(api_key=settings.GROQ_API_KEY)
                model = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
                resp = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt + "\nRespond ONLY with valid JSON."},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=2000,
                )
                raw_response = resp.choices[0].message.content
                if hasattr(resp, "usage") and resp.usage:
                    tokens_used = getattr(resp.usage, "total_tokens", 0) or 0
            elif getattr(settings, "ANTHROPIC_API_KEY", None):
                import anthropic
                client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                model = getattr(settings, "ANTHROPIC_HAIKU_MODEL", "claude-haiku-4-5")
                resp = client.messages.create(
                    model=model,
                    max_tokens=2000,
                    system=system_prompt + "\nRespond ONLY with a valid JSON object. Do not include markdown codeblocks or preamble.",
                    messages=[{"role": "user", "content": user_prompt}],
                )
                raw_response = resp.content[0].text if resp.content else "{}"
                if hasattr(resp, "usage") and resp.usage:
                    tokens_used = (getattr(resp.usage, "input_tokens", 0) or 0) + (getattr(resp.usage, "output_tokens", 0) or 0)
                active_provider_for_billing = "anthropic"

        if raw_response:
            # Clean markdown fences if any
            clean_json = raw_response.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            parsed = json.loads(clean_json.strip())

            # Deduct platform token usage with provider-specific pricing
            if provider == "platform" and tokens_used > 0 and user_id:
                user_row = db.query(User).filter(User.id == user_id).first()
                if user_row:
                    user_row.ai_tokens_used = (user_row.ai_tokens_used or 0) + tokens_used
                    # Use provider-specific rate
                    if active_provider_for_billing == "anthropic":
                        rate = getattr(settings, "INR_PER_1K_TOKENS_ANTHROPIC", 0.20)
                    else:
                        rate = getattr(settings, "INR_PER_1K_TOKENS_GROQ", 0.05)
                    cost_inr = round((tokens_used / 1000.0) * rate, 4)
                    user_row.wallet_consumed = float(user_row.wallet_consumed or 0.0) + cost_inr
                    user_row.wallet_balance = max(0.0, float(user_row.wallet_balance or 0.0) - cost_inr)
                    db.commit()
                    logger.info(f"Platform billing: user={user_id}, provider={active_provider_for_billing}, tokens={tokens_used}, cost=₹{cost_inr}")

            return parsed

    except Exception as e:
        logger.warning(f"Ad Management AI call ({provider}) failed: {e}. Returning tailored deterministic blueprint.")

    return default_fallback


# ── State Retrieval & Initialization ──────────────────────────────────────

def get_or_create_ad_state(db: Session, user_id: int) -> AdManagementState:
    """Retrieves or creates the AdManagementState for the user."""
    state = db.query(AdManagementState).filter(AdManagementState.user_id == user_id).first()
    if not state:
        state = AdManagementState(
            user_id=user_id,
            category_id="product-commerce",
            niche_name="D2C Apparel & Fashion",
            monthly_ad_spend="₹50,000",
            audit_status=StepVerificationStatus.DRAFT,
            tracking_status=StepVerificationStatus.DRAFT,
            creative_status=StepVerificationStatus.DRAFT,
            diagnostics_status=StepVerificationStatus.DRAFT,
        )
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


# ── Tier 1: Audit Orchestration ───────────────────────────────────────────

def generate_ad_audit(
    db: Session,
    user_id: int,
    category_id: str,
    niche_name: str,
    monthly_spend: Optional[str],
    current_roas: Optional[str],
    main_pain_point: Optional[str],
) -> Dict[str, Any]:
    """Generates an automated ad account audit with scorecard & action plan (Status: DRAFT)."""
    state = get_or_create_ad_state(db, user_id)
    state.category_id = category_id
    state.niche_name = niche_name
    if monthly_spend:
        state.monthly_ad_spend = monthly_spend

    # Calculate realistic benchmark score based on input ROAS
    calculated_score = 68
    try:
        if current_roas:
            clean_roas = float(current_roas.replace("x", "").replace("X", "").strip())
            if clean_roas >= 3.5:
                calculated_score = 86
            elif clean_roas >= 2.8:
                calculated_score = 78
            elif clean_roas >= 2.0:
                calculated_score = 69
            elif clean_roas >= 1.2:
                calculated_score = 58
            else:
                calculated_score = 46
    except Exception:
        calculated_score = 71

    health_status = "Healthy / Scalable" if calculated_score >= 80 else ("Needs Optimization" if calculated_score >= 60 else "High Risk / Critical Leak")

    system_prompt = (
        "You are an elite Meta Ads Auditor and Growth Strategist for solo founders and e-commerce brands. "
        "Analyze the provided niche, spend, and ROAS pain points. Generate a comprehensive ad audit in JSON format with: "
        "1. 'score': integer between 45 and 90 "
        "2. 'health_status': string like 'Needs Optimization' or 'High Risk' or 'Healthy' "
        "3. 'findings': list of objects { 'severity': 'high'|'medium'|'low', 'category': str, 'issue': str, 'impact': str, 'fix': str } "
        "4. 'action_plan': list of 4 concrete sequential action strings."
    )
    user_prompt = f"""
Niche: {niche_name} (Category: {category_id})
Monthly Meta Ad Spend: {monthly_spend or '₹50,000'}
Current Blended ROAS: {current_roas or '2.2x'}
Primary Pain Point: {main_pain_point or 'Creative fatigue and rising customer acquisition costs'}
"""

    fallback = {
        "score": calculated_score,
        "health_status": health_status,
        "findings": [
            {
                "severity": "high" if calculated_score < 70 else "medium",
                "category": "Tracking & Server CAPI",
                "issue": f"Missing Server-Side Conversions in {niche_name}",
                "impact": f"At {monthly_spend or '₹50,000'}/mo spend, ~22% of purchases fail client-side pixel firing on iOS 17 devices.",
                "fix": f"Deploy Meta CAPI Gateway to boost Match Quality from current baseline to >8.5/10.",
            },
            {
                "severity": "high",
                "category": "Creative Angle Fatigue",
                "issue": f"Bottleneck: {main_pain_point or 'Creative fatigue'}",
                "impact": f"Current ROAS ({current_roas or '2.2x'}) indicates declining CTR and rising CPMs across cold audience sets.",
                "fix": f"Introduce 3 distinct direct-response creative angles targeted specifically for {niche_name}.",
            },
            {
                "severity": "medium",
                "category": "Campaign Architecture",
                "issue": "Budget Over-fragmentation",
                "impact": f"At {monthly_spend or '₹50,000'}/mo, spreading budget across multiple ad sets results in <₹{max(100, int(int(''.join(filter(str.isdigit, monthly_spend or '50000')) or '50000') / 90))}/day per set, preventing exit from Meta's 50-conversion learning phase.",
                "fix": "Consolidate into 1 Advantage+ Shopping campaign with dynamic creative testing.",
            },
        ],
        "action_plan": [
            f"Activate Meta Conversions API (CAPI) for {niche_name} with unique event deduplication",
            f"Restructure {monthly_spend or '₹50,000'} budget into 70% TOF / 15% MOF / 15% BOF funnel allocation",
            "Generate and launch 3 new problem-solution video and carousel copy angles",
            "Configure automated ROAS safeguards (kill ad sets spending >1.5x CPA without purchases)",
        ],
    }

    result = call_ai_chat_json(db, user_id, system_prompt, user_prompt, fallback)

    # Save as DRAFT state awaiting user verification
    state.audit_score = result.get("score", 72)
    state.audit_findings = result.get("findings", fallback["findings"])
    state.audit_action_plan = result.get("action_plan", fallback["action_plan"])
    state.audit_status = StepVerificationStatus.DRAFT
    db.commit()
    db.refresh(state)

    return state.to_dict()


def verify_ad_audit(
    db: Session,
    user_id: int,
    findings: Optional[list] = None,
    action_plan: Optional[list] = None,
    audit_score: Optional[int] = None,
) -> Dict[str, Any]:
    """Human-in-the-loop: Verifies and locks the Audit tier (Status: VERIFIED)."""
    state = get_or_create_ad_state(db, user_id)
    if findings is not None:
        state.audit_findings = [f.dict() if hasattr(f, "dict") else f for f in findings]
    if action_plan is not None:
        state.audit_action_plan = action_plan
    if audit_score is not None:
        state.audit_score = audit_score

    state.audit_status = StepVerificationStatus.VERIFIED
    state.audit_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(state)
    return state.to_dict()


# ── Tier 2: Setup & Tracking Blueprint ─────────────────────────────────────

def generate_tracking_blueprint(
    db: Session,
    user_id: int,
    pixel_id: Optional[str] = None,
    website_url: Optional[str] = None,
    category_id: Optional[str] = None,
    niche_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates CAPI tracking architecture & funnel budget allocation (Status: DRAFT)."""
    state = get_or_create_ad_state(db, user_id)
    cat = category_id or state.category_id or "product-commerce"
    niche = niche_name or state.niche_name or "D2C Apparel & Fashion"
    state.category_id = cat
    state.niche_name = niche
    if pixel_id:
        state.pixel_id = pixel_id

    system_prompt = (
        "You are a Meta Conversions API (CAPI) Tracking & Funnel Specialist. "
        "Build a setup blueprint in JSON format with: "
        "1. 'event_mapping': list of { 'name': str, 'status': 'active'|'missing'|'warning', 'matchQuality': str, 'fix': str } "
        "2. 'funnel_architecture': { 'tof': { 'objective': str, 'budgetShare': '65%', 'targetRoas': '1.8x - 2.4x', 'formats': list }, 'mof': { 'objective': str, 'budgetShare': '20%', 'targetRoas': '3.2x', 'formats': list }, 'bof': { 'objective': str, 'budgetShare': '15%', 'targetRoas': '4.5x+', 'formats': list } }"
    )
    user_prompt = f"Niche: {state.niche_name}, Pixel ID: {state.pixel_id or '108492049281749'}, URL: {website_url or 'https://example.com'}"

    # Industry-specific event mappings
    if cat == "service-based" or "Consultant" in niche or "Coach" in niche or "Agency" in niche:
        event_mapping = [
            {"name": "PageView", "status": "Browser + Server (CAPI Active)", "matchQuality": "9.4 / 10", "fix": "Direct deduplicated PageView on booking pages."},
            {"name": "ViewContent", "status": "Browser + Server (CAPI Active)", "matchQuality": "8.9 / 10", "fix": "Consulting service packages tracked."},
            {"name": "Lead", "status": "Browser Only (Warning: Add CAPI)", "matchQuality": "6.2 / 10", "fix": "Pass hashed email & phone on consultation form submission."},
            {"name": "Schedule", "status": "Browser Only (Degraded)", "matchQuality": "5.5 / 10", "fix": "Server webhook sync for Calendly / booking appointments."},
            {"name": "CompleteRegistration", "status": "Browser + Server (CAPI Active)", "matchQuality": "9.1 / 10", "fix": "High intent client intake form confirmed."},
        ]
        funnel = {
            "tof": {"objective": "Direct Client Authority & VSL Ads", "budgetShare": "60%", "targetRoas": "2.5x+", "formats": ["Video Sales Letters", "Client Case Breakdowns"]},
            "mof": {"objective": "Warm Case Study & Testimonial Retargeting", "budgetShare": "25%", "targetRoas": "3.8x+", "formats": ["Client Results Grid", "Behind The Strategy"]},
            "bof": {"objective": "High-Intent Calendar Booking Retargeting", "budgetShare": "15%", "targetRoas": "5.0x+", "formats": ["Direct Consultation Booking Banner"]},
        }
    elif cat == "knowledge-content" or "Course" in niche or "Author" in niche:
        event_mapping = [
            {"name": "PageView", "status": "Browser + Server (CAPI Active)", "matchQuality": "9.3 / 10", "fix": "Sales letter PageView tracked."},
            {"name": "ViewContent", "status": "Browser + Server (CAPI Active)", "matchQuality": "9.0 / 10", "fix": "Curriculum overview viewed."},
            {"name": "InitiateCheckout", "status": "Browser Only (Warning: Add CAPI)", "matchQuality": "6.4 / 10", "fix": "Checkout initiation webhook sync."},
            {"name": "Purchase", "status": "Browser + Server (CAPI Active)", "matchQuality": "9.2 / 10", "fix": "Instant digital course unlock attribution."},
        ]
        funnel = {
            "tof": {"objective": "Free Training / Lead Magnet Prospecting", "budgetShare": "65%", "targetRoas": "2.2x+", "formats": ["Framework Breakdown", "Free Blueprint Hook"]},
            "mof": {"objective": "Webinar / Training Attendees Retargeting", "budgetShare": "20%", "targetRoas": "3.5x+", "formats": ["Student Interviews", "Module Previews"]},
            "bof": {"objective": "Enrollment Deadline Recovery", "budgetShare": "15%", "targetRoas": "4.8x+", "formats": ["Closing Cart Countdown"]},
        }
    else:
        event_mapping = [
            {"name": "PageView", "status": "Browser + Server (CAPI Active)", "matchQuality": "9.2 / 10", "fix": "Browser & Server firing cleanly with EventID dedup."},
            {"name": "ViewContent", "status": "Browser + Server (CAPI Active)", "matchQuality": "8.8 / 10", "fix": "Catalog content_ids mapped correctly."},
            {"name": "AddToCart", "status": "Browser Only (Warning: Add CAPI)", "matchQuality": "6.1 / 10", "fix": "Add hashed external_id and phone to server payload."},
            {"name": "InitiateCheckout", "status": "Browser Only (Degraded)", "matchQuality": "5.4 / 10", "fix": "Send hashed email and IP on checkout initiation."},
            {"name": "Purchase", "status": "Browser + Server (CAPI Active)", "matchQuality": "8.9 / 10", "fix": "Server CAPI webhook sending revenue + currency."},
        ]
        funnel = {
            "tof": {"objective": "Advantage+ Broad Prospecting", "budgetShare": "70%", "targetRoas": "2.0x – 2.5x", "formats": ["UGC Reels", "Comparison Carousels"]},
            "mof": {"objective": "Social Video & Engagers Retargeting", "budgetShare": "15%", "targetRoas": "3.2x", "formats": ["Testimonial Highlights", "Unboxing"]},
            "bof": {"objective": "Dynamic Product Retargeting (Cart Abandoners)", "budgetShare": "15%", "targetRoas": "4.5x+", "formats": ["Advantage+ Catalog Carousel"]},
        }

    fallback = {
        "event_mapping": event_mapping,
        "funnel_architecture": funnel,
    }

    result = call_ai_chat_json(db, user_id, system_prompt, user_prompt, fallback)

    state.event_mapping = result.get("event_mapping", fallback["event_mapping"])
    state.funnel_architecture = result.get("funnel_architecture", fallback["funnel_architecture"])
    state.tracking_status = StepVerificationStatus.DRAFT
    db.commit()
    db.refresh(state)

    return state.to_dict()


def verify_tracking_blueprint(
    db: Session,
    user_id: int,
    pixel_id: Optional[str] = None,
    capi_configured: Optional[bool] = True,
    event_mapping: Optional[list] = None,
    funnel_architecture: Optional[dict] = None,
) -> Dict[str, Any]:
    """Human-in-the-loop: Verifies and locks Tier 2 Tracking (Status: VERIFIED)."""
    state = get_or_create_ad_state(db, user_id)
    if pixel_id is not None:
        state.pixel_id = pixel_id
    if capi_configured is not None:
        state.capi_configured = capi_configured
    if event_mapping is not None:
        state.event_mapping = event_mapping
    if funnel_architecture is not None:
        state.funnel_architecture = funnel_architecture

    state.tracking_status = StepVerificationStatus.VERIFIED
    state.tracking_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(state)
    return state.to_dict()


# ── Tier 3: Creatives & Multi-Angle Copywriting ────────────────────────────

def _niche_copy_fallback(niche: str, category: str, product_name: str) -> Dict[str, Any]:
    """
    Returns niche-appropriate deterministic fallback copies when LLM is unavailable.
    Organised by business category so copy is never tonally wrong for the niche.
    """
    is_service = category in ("service-based", "knowledge-content", "local-trade")
    is_saas = category == "hybrid-platform"

    if is_service:
        return {
            "copies": [
                {
                    "id": 1,
                    "angle": "Problem-Agitation & Solution",
                    "headline": f"Still Struggling to Get Clients?",
                    "primaryText": (
                        f"Most {niche} professionals spend months on outreach, referrals, and cold calls "
                        f"— only to fill their calendar with the wrong clients at the wrong price.\n\n"
                        f"Our {product_name} gives you a proven Meta ads system that attracts pre-qualified "
                        f"leads who already understand your value before they ever book a call.\n\n"
                        f"Stop chasing. Start attracting. Book a free strategy session today."
                    ),
                    "cta": "Book a Free Strategy Call",
                    "isApproved": False,
                },
                {
                    "id": 2,
                    "angle": "Social Proof & Authority",
                    "headline": "How Our Clients Hit 10x ROI",
                    "primaryText": (
                        f"\"Within 60 days of working with us, I went from inconsistent enquiries to a fully "
                        f"booked calendar — at rates I was afraid to charge before.\" — Client, {niche}.\n\n"
                        f"If you're a {niche} professional ready to scale without burning out on referrals, "
                        f"our {product_name} gives you the exact system top practitioners use to grow on Meta.\n\n"
                        f"See if you qualify for our next intake."
                    ),
                    "cta": "See If You Qualify",
                    "isApproved": False,
                },
                {
                    "id": 3,
                    "angle": "Direct Value & Risk-Reversal",
                    "headline": "Guaranteed Results or You Don't Pay",
                    "primaryText": (
                        f"We built {product_name} specifically for {niche} professionals who are serious "
                        f"about growing their practice with paid Meta ads — without wasting budget on "
                        f"experiments that don't work.\n\n"
                        f"Our process is structured, our results are documented, and our guarantee is simple: "
                        f"if we don't deliver measurable outcomes, you don't pay.\n\n"
                        f"Claim your complimentary campaign audit today."
                    ),
                    "cta": "Claim Free Campaign Audit",
                    "isApproved": False,
                },
            ]
        }
    elif is_saas:
        return {
            "copies": [
                {
                    "id": 1,
                    "angle": "Problem-Agitation & Solution",
                    "headline": f"Your Team Deserves Better Tools",
                    "primaryText": (
                        f"Manual workflows, scattered data, and tools that don't talk to each other are "
                        f"quietly costing your team hours every week.\n\n"
                        f"{product_name} eliminates the friction — automate the repetitive, surface what matters, "
                        f"and give your team back the time they need to do their best work.\n\n"
                        f"Start your free trial. No credit card required."
                    ),
                    "cta": "Start Free Trial",
                    "isApproved": False,
                },
                {
                    "id": 2,
                    "angle": "Social Proof & Comparison",
                    "headline": "5,000+ Teams Already Switched",
                    "primaryText": (
                        f"\"We cut our reporting time by 70% in the first month. The ROI was immediate.\" "
                        f"— Operations Lead, {niche}.\n\n"
                        f"See why fast-growing teams choose {product_name} over legacy tools that were built "
                        f"for a different era.\n\nGet a personalised demo and see your workflow transformed."
                    ),
                    "cta": "Book a Demo",
                    "isApproved": False,
                },
                {
                    "id": 3,
                    "angle": "Direct Value & Risk-Reversal",
                    "headline": "Try Free. Scale When Ready.",
                    "primaryText": (
                        f"{product_name} is built for {niche} teams that want results before commitment. "
                        f"Start with our full-featured free plan, upgrade only when you've seen the value first-hand.\n\n"
                        f"No long-term contracts. No hidden fees. Cancel anytime."
                    ),
                    "cta": "Get Started Free",
                    "isApproved": False,
                },
            ]
        }
    else:
        # Product / D2C commerce
        return {
            "copies": [
                {
                    "id": 1,
                    "angle": "Problem-Agitation & Solution",
                    "headline": f"Why Your Current {niche.split()[0]} Isn't Enough",
                    "primaryText": (
                        f"Most {niche} products make bold promises — and deliver mediocre results within weeks.\n\n"
                        f"We designed {product_name} for people who refuse to compromise: premium quality, "
                        f"purpose-built for your lifestyle, backed by a 30-day satisfaction guarantee.\n\n"
                        f"Join 3,000+ happy customers. Try it risk-free today."
                    ),
                    "cta": "Shop Risk-Free",
                    "isApproved": False,
                },
                {
                    "id": 2,
                    "angle": "Social Proof & Comparison",
                    "headline": "The #1 Choice in {niche} This Year",
                    "primaryText": (
                        f"\"I've tried everything in this category. Nothing comes close to {product_name}.\" "
                        f"— Verified Buyer.\n\n"
                        f"See why thousands of {niche} customers switched — and never looked back.\n\n"
                        f"Limited stock available. Order yours before it sells out."
                    ),
                    "cta": "Order Yours Now",
                    "isApproved": False,
                },
                {
                    "id": 3,
                    "angle": "Direct Value & Urgency",
                    "headline": "Premium Quality. Honest Price.",
                    "primaryText": (
                        f"{product_name} — designed for {niche} enthusiasts who want the best without "
                        f"paying luxury brand markups.\n\n"
                        f"Free delivery on all orders. 30-day happiness guarantee. "
                        f"Rated 4.8/5 by over 2,000 verified customers."
                    ),
                    "cta": "Get Yours Today",
                    "isApproved": False,
                },
            ]
        }


def generate_ad_creatives(
    db: Session,
    user_id: int,
    category_id: Optional[str] = None,
    niche_name: Optional[str] = None,
    product_name: Optional[str] = "Flagship Offer",
    target_audience: Optional[str] = "Modern conscious buyers",
    tone: Optional[str] = "Direct & Compelling",
    count: int = 3,
) -> Dict[str, Any]:
    """Generates high-converting ad copies & angle hooks (Status: DRAFT)."""
    state = get_or_create_ad_state(db, user_id)
    if category_id:
        state.category_id = category_id
    if niche_name:
        state.niche_name = niche_name

    cat = state.category_id or "product-commerce"
    niche = state.niche_name or "General Business"

    # Detect business type to guide the LLM persona
    is_service = cat in ("service-based", "knowledge-content", "local-trade")
    is_saas = cat == "hybrid-platform"
    business_type = "service/consulting business" if is_service else ("SaaS/subscription product" if is_saas else "direct-to-consumer product brand")

    system_prompt = (
        f"You are an expert Meta Ads direct-response copywriter specialising in {business_type} advertising. "
        f"You write copy that speaks directly to the emotional and practical pain points of the target audience "
        f"in the {niche} space. Your copy is concise, honest, and designed to stop the scroll on Facebook and Instagram feeds. "
        f"IMPORTANT RULES: "
        f"1. Never mention shipping, bundles, or physical product delivery if the business is a {business_type}. "
        f"2. Use language appropriate for {business_type} — e.g. 'book a call', 'free consultation', 'results guaranteed' for services; "
        f"'free trial', 'no credit card', 'cancel anytime' for SaaS; 'free delivery', 'in stock', 'order now' only for physical products. "
        f"3. Each copy must feel distinct — different emotional hook, different opening line, different CTA. "
        f"4. Keep total output under 2000 tokens. "
        f"Respond ONLY with valid JSON with key 'copies': list of {count} objects, each with: "
        f"'id' (int), 'angle' (str), 'headline' (max 7 words, punchy), "
        f"'primaryText' (2-3 short paragraphs, plain text, no markdown), 'cta' (str, 3-5 words), 'isApproved' (false)."
    )

    user_prompt = (
        f"Business Type: {business_type}\n"
        f"Niche: {niche}\n"
        f"Offer/Product Name: {product_name}\n"
        f"Target Audience: {target_audience}\n"
        f"Tone: {tone}\n"
        f"Angles required: Problem-Agitation & Solution, Social Proof & Authority, Direct Value & Risk-Reversal\n"
        f"Number of copy variations: {count}"
    )

    fallback = _niche_copy_fallback(niche, cat, product_name)

    result = call_ai_chat_json(db, user_id, system_prompt, user_prompt, fallback)
    state.generated_copies = result.get("copies", fallback["copies"])
    state.creative_status = StepVerificationStatus.DRAFT
    db.commit()
    db.refresh(state)

    return state.to_dict()


def verify_ad_creatives(
    db: Session,
    user_id: int,
    copies: list,
) -> Dict[str, Any]:
    """Human-in-the-loop: Verifies and locks Approved Creatives (Status: VERIFIED)."""
    state = get_or_create_ad_state(db, user_id)
    state.generated_copies = copies
    state.creative_status = StepVerificationStatus.VERIFIED
    state.creatives_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(state)
    return state.to_dict()


# ── Tier 4: Performance Diagnostics & Optimization Rules ──────────────────

def _diagnostics_fallback(niche: str, category: str, budget: str) -> Dict[str, Any]:
    """Niche-specific estimated first-30-day performance ranges. value = LLM estimate, target = goal threshold."""
    is_service = category in ("service-based", "knowledge-content", "local-trade")
    is_saas = category == "hybrid-platform"

    if is_service:
        return {
            "metrics": [
                {"metric": "Cost Per Lead", "term": "CPL", "definition": "Average cost to acquire one qualified enquiry or booked consultation.", "value": "₹380–₹520", "target": "< ₹500", "status": "good", "note": f"Estimated first-30-day CPL for {niche} on Meta. Problem-specific hooks and lead-form optimisation keep this under ₹500."},
                {"metric": "Click-Through Rate", "term": "CTR", "definition": "Percentage of ad impressions resulting in a click to your booking or landing page.", "value": "1.4–2.0%", "target": "> 1.5%", "status": "good", "note": "Authority positioning and outcome-driven headlines drive CTR above 1.5% for service niches."},
                {"metric": "Lead Volume (Month 1)", "term": "Leads", "definition": "Estimated number of qualified leads in the first 30 days at your planned budget.", "value": "30–55 leads", "target": "> 30 leads", "status": "good", "note": f"Based on {budget}/mo budget and estimated CPL range. Scale budget once CPL stabilises below target."},
                {"metric": "Cost Per 1,000 Impressions", "term": "CPM", "definition": "How much you pay for every 1,000 times your ad is shown. Lower CPM = more reach per rupee.", "value": "₹180–₹280", "target": "< ₹300", "status": "good", "note": "Broad interest targeting and Advantage+ placements keep CPM under ₹300 in early learning phase."},
            ],
            "rules": [
                {"id": 1, "type": "kill", "description": f"Pause any ad set that spends more than 2× target CPL (₹1,000+) with fewer than 3 qualified leads in 48 hours.", "isEnabled": True},
                {"id": 2, "type": "scale", "description": "Increase daily budget by 20% on ad sets generating leads at below ₹450 CPL for 5 consecutive days.", "isEnabled": True},
                {"id": 3, "type": "refresh", "description": f"Flag creative refresh when TOF frequency exceeds 3.5 or CTR drops below 1.0% for {niche} campaigns.", "isEnabled": True},
            ],
        }
    elif is_saas:
        return {
            "metrics": [
                {"metric": "Cost Per Trial Sign-up", "term": "CPT", "definition": "Average cost to acquire one free trial or freemium account registration.", "value": "₹220–₹400", "target": "< ₹350", "status": "good", "note": f"Estimated first-30-day CPT for {niche}. Free trial CTAs typically outperform demo requests by 30%."},
                {"metric": "Click-Through Rate", "term": "CTR", "definition": "Percentage of impressions leading to your landing page.", "value": "1.1–1.8%", "target": "> 1.2%", "status": "good", "note": "Problem-specific hooks ('Your data is scattered') outperform feature-led headlines consistently."},
                {"metric": "Landing Page CVR", "term": "CVR", "definition": "Percentage of page visitors who start a free trial.", "value": "4–8%", "target": "> 5%", "status": "good", "note": "Single clear CTA and social proof (customer count/logos) are the biggest CVR levers."},
                {"metric": "Cost Per 1,000 Impressions", "term": "CPM", "definition": "Cost per 1,000 ad impressions. Lower CPM = more reach per rupee.", "value": "₹150–₹260", "target": "< ₹280", "status": "good", "note": "Broad targeting with Advantage+ placements keeps CPM efficient during learning phase."},
            ],
            "rules": [
                {"id": 1, "type": "kill", "description": "Pause ad sets spending >₹800/day with fewer than 2 trial sign-ups in the last 3 days.", "isEnabled": True},
                {"id": 2, "type": "scale", "description": "Increase budget by 15% on ad sets where CPT is below ₹350 for 4 consecutive days.", "isEnabled": True},
                {"id": 3, "type": "refresh", "description": "Trigger creative review when CTR drops below 0.8% or frequency exceeds 4.0 on TOF audiences.", "isEnabled": False},
            ],
        }
    else:
        return {
            "metrics": [
                {"metric": "Blended ROAS", "term": "ROAS", "definition": "Return on Ad Spend — total revenue divided by total ad spend.", "value": "2.2x–3.5x", "target": "> 2.5x", "status": "good", "note": f"Estimated first-campaign ROAS range for {niche}. Improves as Meta optimises on conversion data."},
                {"metric": "Cost Per Purchase", "term": "CPP", "definition": "Average ad spend to generate one completed purchase.", "value": "₹320–₹580", "target": "< ₹500", "status": "good", "note": "CPP should stay below 30% of your average order value. Improve with stronger product page CVR."},
                {"metric": "Click-Through Rate", "term": "CTR", "definition": "Percentage of ad impressions that result in a click to your product page.", "value": "1.3–2.2%", "target": "> 1.5%", "status": "good", "note": "UGC-style and problem-agitation creatives typically achieve 1.8–2.5% CTR for D2C products."},
                {"metric": "Landing Page CVR", "term": "CVR", "definition": "Percentage of product page visitors who complete a purchase.", "value": "2–4%", "target": "> 2.5%", "status": "good", "note": "Page speed, trust signals, and a single focused CTA are the biggest CVR levers."},
            ],
            "rules": [
                {"id": 1, "type": "kill", "description": "Pause any ad set spending more than 1.5× target CPP with 0 purchases in 48 hours.", "isEnabled": True},
                {"id": 2, "type": "scale", "description": "Increase daily budget by 15% on ad sets maintaining above target ROAS for 3 consecutive days.", "isEnabled": True},
                {"id": 3, "type": "refresh", "description": "Flag creative refresh when TOF frequency exceeds 3.5 or CTR drops below 1.0%.", "isEnabled": True},
            ],
        }


def generate_performance_diagnostics(
    db: Session,
    user_id: int,
    category_id: Optional[str] = None,
    niche_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates pre-launch KPI benchmark targets & kill/scale rules via LLM (Status: DRAFT)."""
    state = get_or_create_ad_state(db, user_id)
    if category_id:
        state.category_id = category_id
    if niche_name:
        state.niche_name = niche_name

    cat = state.category_id or "product-commerce"
    niche = state.niche_name or "General Business"
    budget = state.monthly_ad_spend or "₹50,000"
    is_service = cat in ("service-based", "knowledge-content", "local-trade")
    is_saas = cat == "hybrid-platform"
    business_type = "service/consulting" if is_service else ("SaaS/subscription" if is_saas else "D2C product")

    # Pull campaign context from prior steps to inform the estimate
    approved_copies = [c for c in (state.generated_copies or []) if c.get("isApproved")]
    copy_angles = ", ".join(c.get("angle", "") for c in approved_copies) if approved_copies else "not yet generated"
    campaign_objective = "Lead Generation" if is_service else ("Free Trial Conversions" if is_saas else "Purchase Conversions")
    audit_score = state.audit_score or "unknown"

    system_prompt = (
        f"You are a senior Meta Ads media buyer specialising in {business_type} businesses. "
        f"This business has NOT launched their campaign yet. "
        f"Your job is to estimate realistic first-30-day performance ranges based on their niche, budget, and campaign setup. "
        f"CRITICAL: The 'value' field must contain YOUR ESTIMATED RANGE for month 1 (e.g. '₹380–₹520' or '1.4–2.0%'). "
        f"This is a pre-launch estimate — never output 0, null, or an empty string for value. "
        f"The 'target' field is the threshold they must stay within to be profitable. "
        f"RULES: "
        f"1. Use {business_type}-appropriate metrics: 'Cost Per Lead' + 'CTR' + 'Lead Volume' + 'CPM' for services; "
        f"   'Cost Per Trial' + 'CTR' + 'Landing Page CVR' + 'CPM' for SaaS; "
        f"   'Blended ROAS' + 'Cost Per Purchase' + 'CTR' + 'Landing Page CVR' for D2C. "
        f"2. value = your estimated first-30-day range (string with units, e.g. '₹380–₹520' or '2.2x–3.5x'). "
        f"3. target = the profitability threshold (e.g. '< ₹500' or '> 2.5x'). "
        f"4. status = 'good' for all 4 metrics (these are pre-launch projections, not failures). "
        f"5. note = one sentence explaining what drives this metric and one specific optimisation lever. "
        f"6. Kill/scale rules must use rupee thresholds derived from monthly budget of {budget}. "
        f"Respond ONLY with valid JSON: "
        f"'metrics': list of exactly 4 objects {{metric, term, definition, value, target, status, note}}, "
        f"'rules': list of exactly 3 objects {{id (int), type ('kill'|'scale'|'refresh'), description (str), isEnabled (bool)}}"
    )
    user_prompt = (
        f"Business type: {business_type}\n"
        f"Niche: {niche}\n"
        f"Monthly budget: {budget}\n"
        f"Campaign objective: {campaign_objective}\n"
        f"Ad copy angles approved: {copy_angles}\n"
        f"Account readiness score from Step 1: {audit_score}/100\n"
        f"Estimate realistic first-30-day performance ranges for this specific setup. "
        f"Every 'value' field must be a non-zero estimated range string."
    )

    fallback = _diagnostics_fallback(niche, cat, budget)

    result = call_ai_chat_json(db, user_id, system_prompt, user_prompt, fallback)
    state.performance_metrics = result.get("metrics", fallback["metrics"])
    state.active_rules = result.get("rules", fallback["rules"])
    state.diagnostics_status = StepVerificationStatus.DRAFT
    db.commit()
    db.refresh(state)

    return state.to_dict()


def verify_performance_diagnostics(
    db: Session,
    user_id: int,
    metrics: Optional[list] = None,
    rules: Optional[list] = None,
) -> Dict[str, Any]:
    """Human-in-the-loop: Verifies and locks Diagnostics & Optimization Rules (Status: VERIFIED)."""
    state = get_or_create_ad_state(db, user_id)
    if metrics is not None:
        state.performance_metrics = metrics
    if rules is not None:
        state.active_rules = rules

    state.diagnostics_status = StepVerificationStatus.VERIFIED
    state.diagnostics_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(state)
    return state.to_dict()


# ── Campaign Launch Brief ──────────────────────────────────────────────────

def get_campaign_launch_brief(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Generates a rich Campaign Launch Brief via LLM.
    Outputs:
      - LLM-written narratives per step (actionable, niche-specific)
      - Full approved copy with funnel placement and creative format guidance
      - Rule-by-rule Meta UI path and threshold rationale
      - Personalised 8-step launch checklist
      - meta_api_ready block (Meta Marketing API field names — machine-readable)
      - agent_handoff_prompt (opener for FB Growth Coach session)
    """
    state = get_or_create_ad_state(db, user_id)
    cat = state.category_id or "product-commerce"
    niche = state.niche_name or "General Business"
    budget = state.monthly_ad_spend or "₹50,000"
    is_service = cat in ("service-based", "knowledge-content", "local-trade")
    is_saas = cat == "hybrid-platform"
    business_type = "service/consulting" if is_service else ("SaaS/subscription" if is_saas else "D2C product")

    all_copies = state.generated_copies or []
    approved_copies = [c for c in all_copies if c.get("isApproved")]
    copies_for_brief = approved_copies if approved_copies else all_copies

    if is_service:
        campaign_objective = "LEAD_GENERATION"
        campaign_type = "Lead Ads or Landing Page Lead Campaign"
        optimization_goal = "LEAD"
        tof_pct, mof_pct, bof_pct = "60%", "25%", "15%"
    elif is_saas:
        campaign_objective = "CONVERSIONS"
        campaign_type = "Conversions Campaign (Free Trial CTA)"
        optimization_goal = "COMPLETE_REGISTRATION"
        tof_pct, mof_pct, bof_pct = "65%", "20%", "15%"
    else:
        campaign_objective = "CONVERSIONS"
        campaign_type = "Advantage+ Shopping Campaign (ASC)"
        optimization_goal = "PURCHASE"
        tof_pct, mof_pct, bof_pct = "70%", "15%", "15%"

    tracking_events = state.event_mapping or []
    capi_ready = [e for e in tracking_events if "CAPI" in str(e.get("status", "")) and "Warning" not in str(e.get("status", ""))]
    needs_capi = [e for e in tracking_events if "Warning" in str(e.get("status", "")) or "Degraded" in str(e.get("status", ""))]
    audit_findings = state.audit_findings or []
    action_plan = state.audit_action_plan or []
    perf_metrics = state.performance_metrics or []
    active_rules = state.active_rules or []

    # Serialise copies and rules for the LLM prompt
    copies_summary = "\n".join(
        f"  Copy {i+1} — Angle: {c.get('angle','?')} | Headline: {c.get('headline','?')} | CTA: {c.get('cta','?')}\n"
        f"    Primary Text: {str(c.get('primaryText',''))[:300]}"
        for i, c in enumerate(copies_for_brief)
    )
    rules_summary = "\n".join(
        f"  Rule {r.get('id','?')} ({r.get('type','?')}): {r.get('description','?')} [enabled={r.get('isEnabled',True)}]"
        for r in active_rules
    )
    metrics_summary = "\n".join(
        f"  {m.get('metric','?')}: est. {m.get('value','?')} | goal {m.get('target','?')}"
        for m in perf_metrics
    )
    findings_summary = "\n".join(
        f"  [{f.get('severity','?').upper()}] {f.get('category','?')}: {f.get('issue','?')}"
        for f in audit_findings
    )

    system_prompt = (
        f"You are a senior Meta Ads strategist and campaign architect specialising in {business_type} businesses. "
        f"Your task is to write a complete, professional Campaign Launch Brief for a {niche} business. "
        f"This brief serves TWO purposes: "
        f"(1) a human-readable handoff document a Facebook Marketing Specialist can open and execute immediately, and "
        f"(2) a machine-readable JSON block that maps directly to Meta Marketing API field names for future automation. "
        f"RULES: "
        f"1. Every narrative must reference the specific niche ({niche}), budget ({budget}), and campaign type ({campaign_type}). "
        f"2. Copy placement must assign each approved copy to a funnel stage (TOF/MOF/BOF), audience segment, and recommended creative format. "
        f"3. Each kill/scale rule must include the exact Meta Ads Manager UI navigation path AND a one-sentence rationale for the threshold. "
        f"4. The launch checklist must be 8 personalised steps — no generic instructions. Each step must name a specific action for {niche}. "
        f"5. The agent_handoff_prompt is the FIRST MESSAGE the FB Growth Coach will send — it must reference the approved copy angles, "
        f"   estimated performance ranges, and propose the next strategic question at the level of an experienced media buyer. "
        f"6. meta_api_ready block must use exact Meta Marketing API field names: objective, optimization_goal, billing_event, "
        f"   bid_strategy, daily_budget (in paise, integer), targeting (age_min, age_max, geo_locations, interests), "
        f"   ad_creative fields per copy. Mark fields that need the user to supply values as '<REQUIRED: description>'. "
        f"Respond ONLY with valid JSON matching this exact schema: "
        f"{{"
        f"  \"step1_narrative\": \"<2-3 sentence strategy explanation for {niche}>\","
        f"  \"step2_narrative\": \"<2-3 sentence tracking setup instruction referencing specific events>\","
        f"  \"step3_copy_placement\": ["
        f"    {{\"copy_index\": 1, \"angle\": \"?\", \"funnel_stage\": \"TOF|MOF|BOF\", \"audience_segment\": \"?\","
        f"      \"recommended_format\": \"?\", \"placement_rationale\": \"?\","
        f"      \"full_copy\": {{\"headline\": \"?\", \"primary_text\": \"?\", \"cta\": \"?\"}}}}"
        f"  ],"
        f"  \"step4_rule_guidance\": ["
        f"    {{\"rule_id\": 1, \"type\": \"kill|scale|refresh\", \"description\": \"?\","
        f"      \"meta_ui_path\": \"?\", \"threshold_rationale\": \"?\", \"enabled\": true}}"
        f"  ],"
        f"  \"launch_checklist\": [\"<step 1>\", \"<step 2>\", ...(8 items total)],"
        f"  \"meta_api_ready\": {{"
        f"    \"_note\": \"Replace <REQUIRED> fields before calling Meta Marketing API\","
        f"    \"campaign\": {{\"name\": \"?\", \"objective\": \"?\", \"status\": \"PAUSED\", \"special_ad_categories\": []}},"
        f"    \"ad_set\": {{\"name\": \"?\", \"optimization_goal\": \"?\", \"billing_event\": \"IMPRESSIONS\","
        f"      \"bid_strategy\": \"LOWEST_COST_WITHOUT_CAP\", \"daily_budget\": 0,"
        f"      \"targeting\": {{\"age_min\": 0, \"age_max\": 0, \"geo_locations\": {{}}, \"flexible_spec\": []}}}},"
        f"    \"ads\": []"
        f"  }},"
        f"  \"agent_handoff_prompt\": \"<opening message for FB Growth Coach referencing this specific brief>\""
        f"}}"
    )
    user_prompt = (
        f"Business type: {business_type}\n"
        f"Niche: {niche}\n"
        f"Monthly budget: {budget}\n"
        f"Campaign type: {campaign_type}\n"
        f"Campaign objective: {campaign_objective}\n"
        f"Optimization goal: {optimization_goal}\n"
        f"TOF/MOF/BOF split: {tof_pct} / {mof_pct} / {bof_pct}\n"
        f"Account readiness score: {state.audit_score or 'not set'}/100\n\n"
        f"Audit findings:\n{findings_summary or '  None recorded'}\n\n"
        f"Action plan from Step 1:\n" + ("\n".join(f"  - {a}" for a in action_plan) or "  None recorded") + "\n\n"
        f"Tracking events configured:\n" + ("\n".join(f"  {e.get('name','?')}: {e.get('status','?')}" for e in tracking_events) or "  None") + "\n\n"
        f"Approved ad copies:\n{copies_summary or '  None approved yet'}\n\n"
        f"Performance estimates (Step 4):\n{metrics_summary or '  Not generated yet'}\n\n"
        f"Kill/Scale rules:\n{rules_summary or '  Not configured yet'}\n\n"
        f"Write the complete Campaign Launch Brief JSON now."
    )

    fallback_narrative = (
        f"Run a {campaign_type} with objective {campaign_objective} for {niche}. "
        f"Allocate {tof_pct} to cold TOF audiences, {mof_pct} to warm MOF engagers, {bof_pct} to hot BOF retargeters."
    )
    fallback = {
        "step1_narrative": fallback_narrative,
        "step2_narrative": f"Install Meta Pixel on all pages. Configure CAPI for {len(needs_capi)} event(s) with hashed email, phone, and IP. Deduplication key: event_id = timestamp + user_id hash.",
        "step3_copy_placement": [
            {
                "copy_index": i + 1,
                "angle": c.get("angle", ""),
                "funnel_stage": "TOF" if i == 0 else ("MOF" if i == 1 else "BOF"),
                "audience_segment": "Cold broad audience (25–55, interest-based)" if i == 0 else ("180-day page/IG engagers" if i == 1 else "14-day website visitors"),
                "recommended_format": "Single image or short-form video (15s)",
                "placement_rationale": f"The '{c.get('angle','')}' angle suits this funnel stage because it addresses the primary intent of that audience.",
                "full_copy": {"headline": c.get("headline", ""), "primary_text": c.get("primaryText", ""), "cta": c.get("cta", "")},
            }
            for i, c in enumerate(copies_for_brief)
        ],
        "step4_rule_guidance": [
            {
                "rule_id": r.get("id", i + 1),
                "type": r.get("type", "kill"),
                "description": r.get("description", ""),
                "meta_ui_path": "Meta Ads Manager → Campaigns tab → Automated Rules → Create Rule → Custom Rule",
                "threshold_rationale": "Threshold derived from estimated first-month performance ranges to protect budget during learning phase.",
                "enabled": r.get("isEnabled", True),
            }
            for i, r in enumerate(active_rules)
        ],
        "launch_checklist": [
            f"Create a {campaign_type} in Meta Ads Manager with objective '{campaign_objective}'",
            f"Install Meta Pixel base code on all {niche} landing pages and thank-you pages",
            f"Configure CAPI webhook for {len(needs_capi)} flagged event(s) — pass hashed email, phone, IP",
            f"Upload {len(copies_for_brief)} approved ad creative variation(s) — one ad per copy angle",
            f"Set daily budget: {tof_pct} TOF / {mof_pct} MOF / {bof_pct} BOF from {budget}/mo total",
            "Configure Kill & Scale rules in Meta Ads Manager → Automated Rules → Create Rule",
            "Launch campaign in PAUSED status, review all settings, then set to ACTIVE",
            f"After 7 days, compare CPL/ROAS against Step 4 estimates and pause any ad below threshold",
        ],
        "meta_api_ready": {
            "_note": "Replace <REQUIRED> fields before calling Meta Marketing API",
            "campaign": {
                "name": f"{niche} — {campaign_type} — {datetime.now(timezone.utc).strftime('%b %Y')}",
                "objective": campaign_objective,
                "status": "PAUSED",
                "special_ad_categories": [],
            },
            "ad_set": {
                "name": f"{niche} TOF — Broad Cold",
                "optimization_goal": optimization_goal,
                "billing_event": "IMPRESSIONS",
                "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
                "daily_budget": "<REQUIRED: daily budget in paise, e.g. 50000 = ₹500/day>",
                "targeting": {
                    "age_min": 25,
                    "age_max": 55,
                    "geo_locations": "<REQUIRED: {\"countries\": [\"IN\"]} or city-level spec>",
                    "flexible_spec": "<REQUIRED: interest targeting array>",
                },
            },
            "ads": [
                {
                    "name": f"Ad {i+1} — {c.get('angle', '')}",
                    "ad_creative": {
                        "name": f"Creative {i+1} — {c.get('angle', '')}",
                        "object_story_spec": {
                            "page_id": "<REQUIRED: Meta Page ID>",
                            "link_data": {
                                "message": c.get("primaryText", ""),
                                "link": "<REQUIRED: destination URL>",
                                "name": c.get("headline", ""),
                                "call_to_action": {"type": c.get("cta", "LEARN_MORE").upper().replace(" ", "_")},
                                "image_hash": "<REQUIRED: upload image via /adimages endpoint first>",
                            },
                        },
                    },
                    "status": "PAUSED",
                }
                for i, c in enumerate(copies_for_brief)
            ],
        },
        "agent_handoff_prompt": (
            f"👋 Welcome back! I've loaded your Campaign Launch Brief for **{niche}**.\n\n"
            f"Here's where you stand:\n"
            f"- **Campaign type:** {campaign_type}\n"
            f"- **Monthly budget:** {budget} split {tof_pct} TOF / {mof_pct} MOF / {bof_pct} BOF\n"
            f"- **{len(copies_for_brief)} approved copy angle(s):** {', '.join(c.get('angle','') for c in copies_for_brief)}\n"
            f"- **{len(active_rules)} automation rule(s)** configured\n\n"
            f"The foundation is set. Let's make it campaign-ready.\n\n"
            f"**My first question:** Which audience segment should run your '{copies_for_brief[0].get('angle','first') if copies_for_brief else 'first'}' copy — "
            f"broad cold interest targeting, or do you already have a Custom Audience from website visitors or your email list?"
        ),
    }

    llm_result = call_ai_chat_json(db, user_id, system_prompt, user_prompt, fallback)

    # Merge structured data (not LLM-generated) into the response
    brief = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "niche": niche,
            "category": cat,
            "business_type": business_type,
            "monthly_budget": budget,
            "version": "2.0",
        },
        # LLM-generated narrative and placement fields
        "step1_narrative": llm_result.get("step1_narrative", fallback["step1_narrative"]),
        "step2_narrative": llm_result.get("step2_narrative", fallback["step2_narrative"]),
        "step3_copy_placement": llm_result.get("step3_copy_placement", fallback["step3_copy_placement"]),
        "step4_rule_guidance": llm_result.get("step4_rule_guidance", fallback["step4_rule_guidance"]),
        "launch_checklist": llm_result.get("launch_checklist", fallback["launch_checklist"]),
        "meta_api_ready": llm_result.get("meta_api_ready", fallback["meta_api_ready"]),
        "agent_handoff_prompt": llm_result.get("agent_handoff_prompt", fallback["agent_handoff_prompt"]),
        # Structured data always sourced from DB state (not LLM)
        "structured": {
            "campaign_objective": campaign_objective,
            "campaign_type": campaign_type,
            "budget_allocation": {"tof": tof_pct, "mof": mof_pct, "bof": bof_pct},
            "readiness_score": state.audit_score,
            "tracking_events": tracking_events,
            "capi_ready_count": len(capi_ready),
            "needs_capi_count": len(needs_capi),
            "copies_approved": len(approved_copies),
            "copies_total": len(copies_for_brief),
            "performance_estimates": perf_metrics,
            "rules_total": len(active_rules),
            "rules_active": sum(1 for r in active_rules if r.get("isEnabled", True)),
        },
    }
    return brief
