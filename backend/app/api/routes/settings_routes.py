"""
Site Settings API Routes
GET  /api/settings         — returns all settings as a JSON object (admin only)
PUT  /api/settings         — saves the full or partial settings object (admin only)
GET  /api/settings/public  — returns safe public subset (no auth required)
POST /api/settings/setup   — saves full wizard payload for the current user
GET  /api/settings/mine    — returns the current user's saved site settings
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user, get_current_user
from app.models.user import User
from app.models.site_settings import SiteSetting
from app.models.user_site_settings import UserSiteSettings

router = APIRouter(prefix="/settings", tags=["settings"])

# ---------------------------------------------------------------------------
# The default seed values (mirrors site.config.js so the DB has sane defaults)
# ---------------------------------------------------------------------------
DEFAULT_SETTINGS: Dict[str, Any] = {
    "general": {
        "siteName": "OPC Genie",
        "siteDescription": "Your AI-powered business-in-a-box for solo founders.",
        "adminEmail": "admin@opcgenie.com",
        "supportEmail": "support@opcgenie.com",
        "timezone": "UTC",
        "language": "en",
        "maintenanceMode": False,
        "registrationOpen": True,
        "emailVerification": True,
        "twoFactorRequired": False,
    },
    "security": {
        "sessionTimeout": 24,
        "passwordMinLength": 8,
        "passwordRequireSpecial": True,
        "passwordRequireNumbers": True,
        "passwordRequireUppercase": True,
        "maxLoginAttempts": 5,
        "accountLockoutDuration": 30,
        "ipWhitelist": ["127.0.0.1", "192.168.1.0/24"],
        "sslRequired": True,
        "rateLimitRequests": 1000,
        "rateLimitWindow": 15,
    },
    "email": {
        "provider": "gmail",
        "smtpHost": "smtp.gmail.com",
        "smtpPort": 587,
        "smtpUsername": "",
        "smtpPassword": "",
        "fromEmail": "opcgenie@gmail.com",
        "fromName": "OPC Genie",
        "replyToEmail": "support@opcgenie.com",
        "enableSsl": True,
        "enableStartTls": True,
    },
    "brand": {
        "name": "OPC Genie",
        "tagline": "Your One-Person Company",
        "description": "Your AI-powered business-in-a-box for solo founders.",
        "logoIcon": "Brain",
        "year": "2025",
    },
    "seo": {
        "title": "OPC Genie – Launch Your One-Person Company",
        "description": "Build, brand, and run your one-person company with an AI Genie that handles your website, sales, and support.",
        "keywords": "one person company, solo founder, AI business, OPC, business in a box, AI Genie",
        "siteUrl": "https://opcgenie.com",
    },
    "contact": {
        "email": "opcgenie@gmail.com",
        "phone": "+91 9875561973",
        "location": "India",
    },
    "social": {
        "twitter": "https://twitter.com/opcgenie",
        "linkedin": "https://linkedin.com/company/opcgenie",
        "github": "https://github.com/opcgenie",
        "youtube": "https://youtube.com/opcgenie",
        "facebook": "https://facebook.com/opcgenie",
        "instagram": "https://instagram.com/opcgenie",
    },
    "hero": {
        "badge": "AI-Powered Business-in-a-Box",
        "headline": "Launch Your One-Person Company With Your Own AI Genie",
        "subheadline": "Describe your business. Your Genie builds the site, writes the copy, and runs sales & support — so you can launch and own a real company, solo.",
        "highlightWord": "AI Genie",
        "cta": {
            "primary": {"text": "Build My Business Free", "href": "/setup-wizard"},
            "secondary": {"text": "See Your Genie in Action", "href": "/platform/ai-website-builder"},
        },
    },
    "stats": [
        {"number": "500+", "label": "Founders Launched"},
        {"number": "3x", "label": "Faster Time-to-Market"},
        {"number": "90%", "label": "Setup in Under a Day"},
        {"number": "24/7", "label": "AI Genie Support"},
    ],
    "trustedBy": ["Freelancers", "Consultants", "Coaches", "Creators"],
    "whyDifferent": {
        "title": "Why OPC Genie is Different",
        "subtitle": "Other tools give you templates. Your Genie builds, writes, and runs your business — solo.",
    },
    "valueProps": [
        {"title": "Your Genie Builds It", "description": "Describe your business in plain English. Your AI Genie generates your website, copy, and offer pages automatically.", "highlight": "vs. DIY Page Builders"},
        {"title": "Sells While You Sleep", "description": "AI-powered sales flows, lead capture, and follow-up sequences that convert visitors into paying customers — hands-free.", "highlight": "vs. Manual Follow-up"},
        {"title": "Runs Your Support", "description": "A trained AI handles customer questions, bookings, and FAQs so you never lose a lead to slow response times.", "highlight": "vs. Hiring Staff"},
        {"title": "One Dashboard, Everything", "description": "Manage your website, offers, content, community, and analytics from a single clean admin — no switching tools.", "highlight": "vs. 10 Disconnected Apps"},
    ],
    "features": [
        {"title": "AI Website Builder", "description": "Describe your business and your Genie builds a complete, branded website — no design skills needed", "preview": "Live site in under 10 minutes", "link": "/platform/skillgraph-engine", "status": "Available"},
        {"title": "AI Genie Assistant", "description": "Your always-on business advisor — handles customer queries, writes content, and gives strategic advice", "preview": "Powered by advanced AI models", "link": "/platform/content-studio", "status": "Live Demo"},
        {"title": "Offers & Payments", "description": "Create service packages, digital products, and payment links in minutes — sell anything solo", "preview": "Connect your payment gateway", "link": "/platform/peer-mentor-matching", "status": "Available"},
        {"title": "Founder Community", "description": "Connect with fellow OPC founders, share wins, get feedback, and find collaborators", "preview": "Private, moderated founder network", "link": "/community", "status": "Coming Soon"},
        {"title": "Content Studio", "description": "Generate blog posts, social captions, email sequences, and pitch decks with one prompt", "preview": "Publish across all channels", "link": "/platform/content-studio", "status": "Coming Soon"},
        {"title": "Business Analytics", "description": "Track revenue, visitor behaviour, and customer activity — clear insights, no data science degree needed", "preview": "Simple dashboard, real numbers", "link": "/dashboard", "status": "Available"},
    ],
    "testimonials": [
        {"name": "Priya Sharma", "role": "Independent Consultant", "content": "I launched my consulting website and started getting client enquiries within 48 hours. The AI Genie wrote better copy than I ever could have on my own.", "rating": 5},
        {"name": "James Okafor", "role": "Solo SaaS Founder", "content": "I replaced three separate tools — website builder, CRM, and support chat — with just OPC Genie. My overhead dropped and my conversions went up.", "rating": 5},
        {"name": "Anika Müller", "role": "Freelance Designer", "content": "Setting up felt like talking to a very smart business partner. I described what I do, and it built my entire site, pricing page, and FAQ in one session.", "rating": 5},
    ],
    "footerLinks": {
        "platform": [
            {"name": "AI Website Builder", "href": "/platform/skillgraph-engine"},
            {"name": "AI Genie Assistant", "href": "/platform/industry-simulator"},
            {"name": "Offers & Payments", "href": "/platform/peer-mentor-matching"},
            {"name": "Content Studio", "href": "/platform/content-co-creation"},
            {"name": "Analytics", "href": "/dashboard"},
            {"name": "Community", "href": "/community"},
        ],
        "resources": [
            {"name": "Playbooks", "href": "/resources"},
            {"name": "Blog", "href": "/blog"},
            {"name": "Case Studies", "href": "/case-studies"},
            {"name": "Help Center", "href": "/help"},
            {"name": "Contact", "href": "/contact"},
        ],
        "company": [
            {"name": "About Us", "href": "/about"},
            {"name": "Careers", "href": "/careers"},
            {"name": "Press", "href": "/press"},
            {"name": "Partners", "href": "/partners"},
            {"name": "Contact", "href": "/contact"},
        ],
    },
    "ecosystemSection": {
        "title": "Complete Business",
        "subtitle": "Everything a solo founder needs to launch, sell, and grow — in one place",
    },
    "socialProofSection": {
        "title": "Trusted by",
        "highlight": "Solo Founders",
        "subtitle": "Join hundreds of one-person companies already running on OPC Genie",
    },
    "cta": {
        "headline": "Your Business. Built by Your Genie.",
        "subheadline": "Stop juggling tools. Describe what you do — your Genie handles the rest.",
        "primary": {"text": "Build My Business Free", "href": "/setup-wizard"},
        "secondary": {"text": "Book a Live Demo", "href": "/contact"},
        "badges": [
            "No credit card required",
            "Live in under 10 minutes",
            "Cancel anytime",
        ],
    },
    "pricing": {
        "currency": "₹",
        "annualDiscountPercent": 20,
        "plans": [
            {
            "name": "Launch",
            "description": "Everything you need to get your one-person company live",
            "monthlyPrice": 0,
            "badge": "Free Forever",
            "buttonText": "Start Free",
            "buttonHref": "/setup-wizard",
            "target": "Solo founders just starting out",
            "features": [
                "AI-generated website (1 site)",
                "Up to 3 service/product offers",
                "AI Genie assistant (50 queries/day)",
                "Basic contact form",
                "Community access",
                "OPC Genie subdomain",
                "Email support",
            ],
            "restrictions": ["No custom domain", "No payment integrations", "No analytics dashboard"],
            },
            {
            "name": "Grow",
            "description": "Run your full business from one dashboard",
            "monthlyPrice": 999,
            "badge": "Most Popular",
            "buttonText": "Start 7-Day Free Trial",
            "buttonHref": "/setup-wizard",
            "target": "Active solo founders & freelancers",
            "features": [
                "Everything in Launch",
                "Custom domain connection",
                "Unlimited offers & products",
                "Unlimited AI Genie queries",
                "Payment gateway integration",
                "AI content studio",
                "Analytics dashboard",
                "Email & WhatsApp lead capture",
                "Priority support",
                "30-day money-back guarantee",
            ],
            "restrictions": [],
            },
            {
            "name": "Scale",
            "description": "Advanced automation and white-glove setup for serious founders",
            "monthlyPrice": 4999,
            "badge": "Best Value",
            "buttonText": "Book Consultation",
            "buttonHref": "/contact",
            "target": "High-revenue solo businesses",
            "highlight": True,
            "features": [
                "Everything in Grow",
                "Done-for-you Genie setup session",
                "Advanced AI sales automation",
                "CRM & lead pipeline",
                "Custom AI Genie training on your business",
                "Multi-page site with blog",
                "White-label option",
                "Dedicated account manager",
                "Phone & video call support",
                "Lifetime community access",
            ],
            "restrictions": [],
            },
        ],
        "faqs": [
        {"question": "Do I need technical skills to use OPC Genie?", "answer": "None at all. You describe your business in plain English and your Genie handles everything — design, copy, setup, and automation."},
        {"question": "Can I use my own domain name?", "answer": "Yes, on the Grow and Scale plans you can connect any custom domain. Free plan gets an OPC Genie subdomain."},
        {"question": "What payment gateways are supported?", "answer": "Razorpay, Stripe, and PayPal are supported on Grow and Scale plans. More gateways are being added regularly."},
        {"question": "Can I switch plans anytime?", "answer": "Absolutely. Upgrade or downgrade at any time — changes take effect immediately with prorated billing."},
        {"question": "What is the AI Genie trained on?", "answer": "Your Genie is trained on your business description, your offers, your FAQs, and your past conversations so it always speaks in your voice."},
        {"question": "Is my business data private?", "answer": "Yes. Your data is never shared with other users or used to train models outside your account."},
        {"question": "What happens after the free trial?", "answer": "You choose a paid plan or stay on the free tier — no automatic charges, no card required to start."},
        ],
    },
    "resourcesPage": {
        "badge": "Founder Playbooks & Guides",
        "title": "Founder Playbooks",
        "subtitle": "Guides, templates, and tools to help you launch, sell, and grow your one-person company.",
        "searchPlaceholder": "Search playbooks, templates, checklists...",
        "emptyStateTitle": "No playbooks found",
        "emptyStateDescription": "No playbooks match the selected filters or search query yet.",
    },
    "playbook_categories": [
        {"id": "launch", "name": "Launch"},
        {"id": "ai-genie", "name": "AI Genie Usage"},
        {"id": "legal", "name": "Legal & Compliance"},
        {"id": "sales", "name": "Sales & Marketing"},
        {"id": "money", "name": "Money & Payments"},
        {"id": "templates", "name": "Templates"},
    ],
    "marketing_page": {
        "hero": {
            "headline": "Stop renting your business. Own it.",
            "subheadline": "Describe your business. Your AI Genie builds the site, writes the copy, and runs it — no monthly rent, no lock-in.",
            "cta_label": "Start free",
            "cta_href": "/setup-wizard",
            "show_live_demo": True,
        },
        "problem_bullets": [
            "Monthly SaaS rent that never ends",
            "Platforms that own your customer data",
            "Generic templates that need a developer",
        ],
        "feature_grid": [
            {"title": "Build", "before": "One month with a developer", "after": "One prompt, live in minutes"},
            {"title": "Sell", "before": "Stitching together checkout tools", "after": "Offer page + payments in a day"},
            {"title": "Run", "before": "Answering DMs at midnight", "after": "AI Genie handles enquiries 24/7"},
            {"title": "Grow", "before": "Guessing what's working", "after": "Founder analytics + playbooks"},
        ],
        "comparison_table": {
            "competitors": ["OPC Genie", "Graphy", "Kajabi", "Skool"],
            "rows": [
                {"label": "Pricing model", "values": ["Flat license", "Monthly %", "Monthly $", "Monthly $"]},
                {"label": "You own the code", "values": ["Yes", "No", "No", "No"]},
                {"label": "White-label", "values": ["Day one", "Paid tier", "Paid tier", "No"]},
            ],
        },
        "testimonials": [],
        "lead_magnet": {
            "enabled": True,
            "resource_id": None,
            "headline": "Get the Solo Founder Launch Playbook",
            "cta_label": "Send me the playbook",
        },
        "final_cta": {
            "headline": "Build your business today.",
            "cta_label": "Start free",
        },
    },
}

# Public keys that are safe to expose without authentication
PUBLIC_KEYS = {
    "brand", "contact", "social", "seo", "hero", "stats", "trustedBy", "cta", "pricing",
    "whyDifferent", "valueProps", "features", "testimonials", "footerLinks",
    "ecosystemSection", "socialProofSection", "resourcesPage", "playbook_categories", "marketing_page",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_all_settings(db: Session) -> Dict[str, Any]:
    """Return all settings rows merged into a single dict."""
    rows = db.query(SiteSetting).all()
    result = {}
    for row in rows:
        result[row.key] = row.value
    return result


def _upsert_setting(db: Session, key: str, value: Any) -> None:
    """Insert or update a single settings row."""
    row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(SiteSetting(key=key, value=value))


def seed_default_settings(db: Session) -> None:
    """
    Called at startup — only writes rows that don't already exist.
    Existing customisations are never overwritten.
    """
    for key, value in DEFAULT_SETTINGS.items():
        existing = db.query(SiteSetting).filter(SiteSetting.key == key).first()
        if not existing:
            db.add(SiteSetting(key=key, value=value))
    db.commit()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/playbook_categories")
async def get_playbook_categories(db: Session = Depends(get_db)):
    """Public endpoint returning the list of configured playbook categories."""
    row = db.query(SiteSetting).filter(SiteSetting.key == "playbook_categories").first()
    if row is not None and row.value is not None:
        return row.value
    return DEFAULT_SETTINGS["playbook_categories"]


@router.get("/public")
async def get_public_settings(db: Session = Depends(get_db)):
    """
    Returns the public-safe subset of settings.
    No authentication required — used by frontend public pages.
    """
    all_settings = _get_all_settings(db)
    # Fall back to defaults for any key not yet in the DB
    merged = {k: DEFAULT_SETTINGS.get(k, {}) for k in PUBLIC_KEYS}
    for k in PUBLIC_KEYS:
        if k in all_settings:
            merged[k] = all_settings[k]
    return merged


@router.get("")
async def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Returns all settings (admin only).
    """
    all_settings = _get_all_settings(db)
    # Merge with defaults so every key is always present
    merged = dict(DEFAULT_SETTINGS)
    merged.update(all_settings)
    return merged


@router.put("")
async def update_settings(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Saves the provided settings keys (admin only).
    Only the keys present in the payload are updated; others are untouched.
    """
    for key, value in payload.items():
        _upsert_setting(db, key, value)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save settings: {str(e)}",
        )
    return {"success": True, "message": "Settings saved successfully."}


# ---------------------------------------------------------------------------
# User-scoped setup wizard routes
# ---------------------------------------------------------------------------

# Schema 2.0 wizard keys — any payload containing one of these is tagged v2.
_V2_KEYS = frozenset({
    "start", "identity", "positioning", "offers", "proof",
    "frontDoor", "knowledge", "brand", "agents", "payments", "channels", "site",
    "template", "template_data",
})


def _upsert_user_setting(db: Session, user_id: int, key: str, value: Any, schema_version: str = "1.0") -> None:
    """Insert or update a single user_site_settings row.

    When key == 'template', also writes the denormalised template_slug and
    template_section columns (added in migration g2h3i4j5k6l7) so the
    backend can query template selection without parsing the JSONB value.
    The writes are wrapped in a hasattr guard so a missing column never
    breaks saves for any other key (defensive against unapplied migrations).
    """
    row = (
        db.query(UserSiteSettings)
        .filter(UserSiteSettings.user_id == user_id, UserSiteSettings.key == key)
        .first()
    )

    if row:
        row.value = value
        row.schema_version = schema_version
        # Denormalised columns — only set when key == 'template' and columns exist
        if key == "template" and isinstance(value, dict) and hasattr(UserSiteSettings, "template_slug"):
            row.template_slug    = value.get("slug")
            row.template_section = value.get("sectionId")
    else:
        kwargs: Dict[str, Any] = dict(
            user_id=user_id,
            key=key,
            value=value,
            schema_version=schema_version,
        )
        if key == "template" and isinstance(value, dict) and hasattr(UserSiteSettings, "template_slug"):
            kwargs["template_slug"]    = value.get("slug")
            kwargs["template_section"] = value.get("sectionId")
        db.add(UserSiteSettings(**kwargs))


@router.post("/setup", status_code=status.HTTP_200_OK)
async def save_user_setup(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Saves the full Setup Wizard payload for the authenticated user.
    Each top-level key in the payload becomes one row in user_site_settings.
    Existing rows for this user are overwritten; other keys are untouched.
    Detects schema 2.0 payloads by presence of v2-specific keys and tags rows accordingly.
    """
    schema_version = "2.0" if _V2_KEYS.intersection(payload.keys()) else "1.0"
    for key, value in payload.items():
        _upsert_user_setting(db, current_user.id, key, value, schema_version)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save setup: {str(e)}",
        )
    return {"success": True, "message": "Setup saved successfully."}


@router.get("/mine")
async def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all site settings saved by the current user via the Setup Wizard.
    Falls back to the global defaults for any key not yet saved by this user.
    """
    rows = (
        db.query(UserSiteSettings)
        .filter(UserSiteSettings.user_id == current_user.id)
        .all()
    )
    result = {row.key: row.value for row in rows}
    return result
