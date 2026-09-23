"""
Seed script for Playbooks (Resource) and Playbook Categories (SiteSetting)

Additive update: keeps every existing category and playbook untouched,
adds new categories/content that map to features actually built in this
codebase (Genie/wizard, templates, Sales Desk enquiries, Meta Ad
Management). Deliberately does NOT add an "ad-campaigns-google" category —
that suite doesn't exist yet, and seeding content for it would dangle as
a promise the product can't keep. Add it when Google Ads support ships.
"""
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.resource import Resource
from app.models.site_settings import SiteSetting

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Categories — original six kept as-is, new ones appended
# ---------------------------------------------------------------------------

SEED_CATEGORIES = [
    # Existing (unchanged)
    {"id": "launch", "name": "Launch"},
    {"id": "ai-genie", "name": "AI Genie Usage"},
    {"id": "legal", "name": "Legal & Compliance"},
    {"id": "sales", "name": "Sales & Marketing"},
    {"id": "money", "name": "Money & Payments"},
    {"id": "templates", "name": "Templates"},
    # New — mapped to real, currently-built product areas
    {"id": "positioning", "name": "Positioning"},
    {"id": "offers-tiers", "name": "Offers & Pricing Tiers"},
    {"id": "honesty-rules", "name": "What the AI Won't Let You Say"},
    {"id": "theme-selection", "name": "Theme & Template Selection"},
    {"id": "sales-desk-setup", "name": "AI Sales Desk Setup"},
    {"id": "sales-desk-approval", "name": "Approving AI Sales Desk Replies"},
    {"id": "ad-campaigns-meta", "name": "Meta Ads"},
]

# ---------------------------------------------------------------------------
# Playbooks — original six kept as-is, new ones appended
# ---------------------------------------------------------------------------

SEED_PLAYBOOKS = [
    # ── Existing (unchanged) ────────────────────────────────────────────
    {
        "title": "One-Person Company Launch Checklist & Playbook",
        "description": "Step-by-step roadmap to setting up legal structure, branding, offer suite, and launch campaign in 7 days.",
        "category": "launch",
        "content_type": "checklist",
        "is_featured": True,
        "is_public": True,
        "read_time_minutes": 15,
        "file_url": "/downloads/opc-launch-checklist.pdf",
        "difficulty": "Beginner",
        "duration": "15 min read",
        "author": "OPC Genie Team",
        "tags": ["Launch", "Checklist", "Solo Founder"],
        "rating": 4.9,
        "downloads": 1240,
        "is_published": True,
        "nav_order": 1,
    },
    {
        "title": "Mastering Your AI Genie: Prompting & Automation Playbook",
        "description": "How to train your AI Genie to generate high-converting landing pages, draft client proposals, and automate client replies.",
        "category": "ai-genie",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 25,
        "file_url": None,
        "difficulty": "Intermediate",
        "duration": "25 min read",
        "author": "OPC Genie AI Lab",
        "tags": ["AI Genie", "Automation", "Workflows"],
        "rating": 4.8,
        "downloads": 890,
        "is_published": True,
        "nav_order": 2,
        "related_route": "/platform/ai-website-builder",
        "unlocks_after_phase": None,
    },
    {
        "title": "Solo Founder Standard Client Agreement & Privacy Template",
        "description": "Standard service agreement terms, limitation of liability, and privacy policy templates customizable for solo consultants and creators.",
        "category": "legal",
        "content_type": "template",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 10,
        "file_url": "/downloads/solo-founder-legal-pack.docx",
        "difficulty": "Beginner",
        "duration": "10 min read",
        "author": "Legal Advisory Team",
        "tags": ["Legal", "Contracts", "Templates"],
        "rating": 4.7,
        "downloads": 1520,
        "is_published": True,
        "nav_order": 3,
    },
    {
        "title": "Outbound Sales & Social Proof Engine for Solo Founders",
        "description": "A repeatable playbook for acquiring your first 10 high-paying clients through cold outreach, LinkedIn distribution, and testimonials.",
        "category": "sales",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 30,
        "file_url": None,
        "difficulty": "Intermediate",
        "duration": "30 min read",
        "author": "Growth Advisory",
        "tags": ["Sales", "Outreach", "Client Acquisition"],
        "rating": 4.9,
        "downloads": 2100,
        "is_published": True,
        "nav_order": 4,
    },
    {
        "title": "Pricing & Invoicing Playbook for Solo Service Businesses",
        "description": "How to package retainers, set up payment gateways (Razorpay, Stripe, PayPal), and handle cross-border payments without friction.",
        "category": "money",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 20,
        "file_url": None,
        "difficulty": "Intermediate",
        "duration": "20 min read",
        "author": "Finance Advisory",
        "tags": ["Pricing", "Invoicing", "Payments"],
        "rating": 4.8,
        "downloads": 970,
        "is_published": True,
        "nav_order": 5,
    },
    {
        "title": "High-Converting Offer & Proposal Template Bundle",
        "description": "Plug-and-play pitch decks, one-page client proposals, and scope of work templates designed to close deals on the spot.",
        "category": "templates",
        "content_type": "download",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 5,
        "file_url": "/downloads/offer-proposal-templates.zip",
        "difficulty": "Beginner",
        "duration": "5 min setup",
        "author": "OPC Studio",
        "tags": ["Proposals", "Decks", "Templates"],
        "rating": 5.0,
        "downloads": 3400,
        "is_published": True,
        "nav_order": 6,
    },

    # ── New: tied to Genie/wizard steps (schema 2.0 fields, honesty rules) ──
    {
        "title": "Writing a Positioning Statement the AI Can Work With",
        "description": "How to describe who you serve and what makes you different in a way Genie can turn into real homepage copy — not vague marketing language it has to guess at.",
        "category": "positioning",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 8,
        "file_url": None,
        "difficulty": "Beginner",
        "duration": "8 min read",
        "author": "OPC Genie Team",
        "tags": ["Positioning", "Wizard", "Genie"],
        "rating": 0.0,
        "downloads": 0,
        "is_published": True,
        "nav_order": 10,
        "related_route": "/setup-wizard",
        "unlocks_after_phase": None,
    },
    {
        "title": "Structuring Your Three Offer Tiers (Front Door, Core, Recurring)",
        "description": "What belongs in each tier, how pricing and deliverables should differ, and how this maps to the Offer rows your site and payments actually use.",
        "category": "offers-tiers",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 10,
        "file_url": None,
        "difficulty": "Beginner",
        "duration": "10 min read",
        "author": "OPC Genie Team",
        "tags": ["Offers", "Pricing", "Wizard"],
        "rating": 0.0,
        "downloads": 0,
        "is_published": True,
        "nav_order": 11,
        "related_route": "/setup-wizard",
        "unlocks_after_phase": None,
    },
    {
        "title": "What the AI Won't Let You Say (and Why)",
        "description": "The copy generator rejects prices, numbers, names, and quotes it can't find in your input. Here's what counts as valid proof, so your build doesn't get bounced back for edits.",
        "category": "honesty-rules",
        "content_type": "guide",
        "is_featured": True,
        "is_public": True,
        "read_time_minutes": 6,
        "file_url": None,
        "difficulty": "Beginner",
        "duration": "6 min read",
        "author": "OPC Genie Team",
        "tags": ["Honesty Validator", "Proof", "Wizard"],
        "rating": 0.0,
        "downloads": 0,
        "is_published": True,
        "nav_order": 12,
        "related_route": "/setup-wizard",
        "unlocks_after_phase": None,
    },

    # ── New: template gallery ────────────────────────────────────────────
    {
        "title": "Choosing the Right Template for Your Business Type",
        "description": "A quick guide to the 11 live templates across Service-Based, Knowledge & Content, Local & Trade, and Product & Commerce — and which one fits businesses like yours.",
        "category": "theme-selection",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 7,
        "file_url": None,
        "difficulty": "Beginner",
        "duration": "7 min read",
        "author": "OPC Studio",
        "tags": ["Templates", "Theme", "Design"],
        "rating": 0.0,
        "downloads": 0,
        "is_published": True,
        "nav_order": 13,
        "related_route": "/templates",
        "unlocks_after_phase": 1,
    },

    # ── New: AI Sales Desk (enquiry_routes.py is live) ──────────────────
    {
        "title": "Getting Started with AI Sales Desk",
        "description": "How incoming enquiries turn into AI-drafted replies, what the agent can and can't do on its own, and how to read the pipeline once real leads start arriving.",
        "category": "sales-desk-setup",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 9,
        "file_url": None,
        "difficulty": "Beginner",
        "duration": "9 min read",
        "author": "OPC Genie Team",
        "tags": ["Sales Desk", "Enquiries", "AI Agent"],
        "rating": 0.0,
        "downloads": 0,
        "is_published": True,
        "nav_order": 14,
        # TODO: confirm the actual frontend route once the Sales Desk
        # dashboard page ships — leaving unset rather than guessing wrong.
        "related_route": None,
        "unlocks_after_phase": 3,
    },
    {
        "title": "Reviewing and Approving AI-Drafted Replies Safely",
        "description": "What to check before you approve-and-send, when to edit vs. rewrite, and how to set limits so the agent never sends something you haven't seen.",
        "category": "sales-desk-approval",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 8,
        "file_url": None,
        "difficulty": "Beginner",
        "duration": "8 min read",
        "author": "OPC Genie Team",
        "tags": ["Sales Desk", "Approval", "Safety"],
        "rating": 0.0,
        "downloads": 0,
        "is_published": True,
        "nav_order": 15,
        "related_route": None,
        "unlocks_after_phase": 3,
    },

    # ── New: Meta Ad Management (ad_agent_routes.py is live) ────────────
    {
        "title": "Your First Meta Campaign, Step by Step",
        "description": "How the 4-step Ad Management flow works — Campaign Strategy, Tracking Setup, Ad Creatives, and Kill & Scale Rules — and what to review at each human-in-the-loop checkpoint before you spend a rupee.",
        "category": "ad-campaigns-meta",
        "content_type": "guide",
        "is_featured": True,
        "is_public": True,
        "read_time_minutes": 12,
        "file_url": None,
        "difficulty": "Beginner",
        "duration": "12 min read",
        "author": "OPC Ad Management Team",
        "tags": ["Meta Ads", "Ad Management", "CAPI"],
        "rating": 0.0,
        "downloads": 0,
        "is_published": True,
        "nav_order": 16,
        # TODO: confirm the exact page path hosting AdManagementSection.js
        "related_route": None,
        "unlocks_after_phase": 3,
    },
    {
        "title": "Setting Up Meta Conversions API (CAPI) Without a Developer",
        "description": "What the downloaded CAPI setup JSON contains, where to paste it (Shopify, WooCommerce, or your own backend / GTM server container), and how to tell if event match quality actually improved.",
        "category": "ad-campaigns-meta",
        "content_type": "guide",
        "is_featured": False,
        "is_public": True,
        "read_time_minutes": 10,
        "file_url": None,
        "difficulty": "Intermediate",
        "duration": "10 min read",
        "author": "OPC Ad Management Team",
        "tags": ["Meta Ads", "CAPI", "Tracking"],
        "rating": 0.0,
        "downloads": 0,
        "is_published": True,
        "nav_order": 17,
        "related_route": None,
        "unlocks_after_phase": 3,
    },
]


def seed_playbooks():
    """Ensure database tables are up to date and seed categories & playbooks."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # 1. Upsert playbook_categories in site_settings
        cat_setting = db.query(SiteSetting).filter(SiteSetting.key == "playbook_categories").first()
        if not cat_setting:
            cat_setting = SiteSetting(key="playbook_categories", value=SEED_CATEGORIES)
            db.add(cat_setting)
            logger.info("Inserted playbook_categories in site_settings")
        else:
            cat_setting.value = SEED_CATEGORIES
            logger.info("Updated playbook_categories in site_settings")

        db.commit()

        # 2. Seed placeholder Resource rows if table is empty or missing these titles
        for item in SEED_PLAYBOOKS:
            existing = db.query(Resource).filter(Resource.title == item["title"]).first()
            if not existing:
                db.add(Resource(**item))
                logger.info(f"Seeded Resource: {item['title']}")
            else:
                for k, v in item.items():
                    setattr(existing, k, v)
                logger.info(f"Updated Resource: {item['title']}")

        db.commit()
        logger.info("Playbook seeding complete!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding playbooks: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_playbooks()