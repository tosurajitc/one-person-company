"""Push updated OPC Genie config values to the database."""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.DATABASE_URL)

rows = {
    "stats": [
        {"number": "500+", "label": "Founders Launched"},
        {"number": "3x",   "label": "Faster Time-to-Market"},
        {"number": "90%",  "label": "Setup in Under a Day"},
        {"number": "24/7", "label": "AI Genie Support"},
    ],
    "trustedBy": ["Freelancers", "Consultants", "Coaches", "Creators"],
    "whyDifferent": {
        "title":    "Why OPC Genie is Different",
        "subtitle": "Other tools give you templates. Your Genie builds, writes, and runs your business — solo.",
    },
    "ecosystemSection": {
        "title":    "Complete Business",
        "subtitle": "Everything a solo founder needs to launch, sell, and grow — in one place",
    },
    "socialProofSection": {
        "title":     "Trusted by",
        "highlight": "Solo Founders",
        "subtitle":  "Join hundreds of one-person companies already running on OPC Genie",
    },
    "valueProps": [
        {"title": "Your Genie Builds It",       "description": "Describe your business in plain English. Your AI Genie generates your website, copy, and offer pages automatically.",             "highlight": "vs. DIY Page Builders"},
        {"title": "Sells While You Sleep",      "description": "AI-powered sales flows, lead capture, and follow-up sequences that convert visitors into paying customers — hands-free.",          "highlight": "vs. Manual Follow-up"},
        {"title": "Runs Your Support",          "description": "A trained AI handles customer questions, bookings, and FAQs so you never lose a lead to slow response times.",                    "highlight": "vs. Hiring Staff"},
        {"title": "One Dashboard, Everything",  "description": "Manage your website, offers, content, community, and analytics from a single clean admin — no switching tools.",                  "highlight": "vs. 10 Disconnected Apps"},
    ],
    "features": [
        {"title": "AI Website Builder",    "description": "Describe your business and your Genie builds a complete, branded website — no design skills needed", "preview": "Live site in under 10 minutes",       "link": "/platform/website-builder",  "status": "Available"},
        {"title": "AI Genie Assistant",    "description": "Your always-on business advisor — handles customer queries, writes content, and gives strategic advice",  "preview": "Powered by advanced AI models",      "link": "/platform/ai-genie",          "status": "Live Demo"},
        {"title": "Offers & Payments",     "description": "Create service packages, digital products, and payment links in minutes — sell anything solo",           "preview": "Connect your payment gateway",       "link": "/platform/offers",            "status": "Available"},
        {"title": "Founder Community",     "description": "Connect with fellow OPC founders, share wins, get feedback, and find collaborators",                    "preview": "Private, moderated founder network", "link": "/community",                  "status": "Available"},
        {"title": "Content Studio",        "description": "Generate blog posts, social captions, email sequences, and pitch decks with one prompt",                "preview": "Publish across all channels",        "link": "/platform/content-studio",    "status": "Coming Soon"},
        {"title": "Business Analytics",    "description": "Track revenue, visitor behaviour, and customer activity — clear insights, no data science degree needed","preview": "Simple dashboard, real numbers",     "link": "/dashboard",                  "status": "Available"},
    ],
    "testimonials": [
        {"name": "Priya Sharma",  "role": "Independent Consultant", "content": "I launched my consulting website and started getting client enquiries within 48 hours. The AI Genie wrote better copy than I ever could have on my own.", "rating": 5},
        {"name": "James Okafor", "role": "Solo SaaS Founder",       "content": "I replaced three separate tools — website builder, CRM, and support chat — with just OPC Genie. My overhead dropped and my conversions went up.",       "rating": 5},
        {"name": "Anika Müller", "role": "Freelance Designer",      "content": "Setting up felt like talking to a very smart business partner. I described what I do, and it built my entire site, pricing page, and FAQ in one session.", "rating": 5},
    ],
    "cta": {
        "headline":    "Your Business. Built by Your Genie.",
        "subheadline": "Stop juggling tools. Describe what you do — your Genie handles the rest.",
        "primary":   {"text": "Build My Business Free", "href": "/admin/setup-wizard"},
        "secondary": {"text": "Book a Live Demo",       "href": "/contact"},
        "badges": ["No credit card required", "Live in under 10 minutes", "Cancel anytime"],
    },
    "pricing": {
        "currency": "₹",
        "annualDiscountPercent": 20,
        "plans": [
            {
                "name": "Launch", "description": "Everything you need to get your one-person company live",
                "monthlyPrice": 0, "badge": "Free Forever", "buttonText": "Start Free", "buttonHref": "/admin/setup-wizard",
                "target": "Solo founders just starting out", "highlight": False,
                "features": ["AI-generated website (1 site)", "Up to 3 service/product offers", "AI Genie assistant (50 queries/day)", "Basic contact form", "Community access", "OPC Genie subdomain", "Email support"],
                "restrictions": ["No custom domain", "No payment integrations", "No analytics dashboard"],
            },
            {
                "name": "Grow", "description": "Run your full business from one dashboard",
                "monthlyPrice": 999, "badge": "Most Popular", "buttonText": "Start 7-Day Free Trial", "buttonHref": "/admin/setup-wizard",
                "target": "Active solo founders & freelancers", "highlight": False,
                "features": ["Everything in Launch", "Custom domain connection", "Unlimited offers & products", "Unlimited AI Genie queries", "Payment gateway integration", "AI content studio", "Analytics dashboard", "Email & WhatsApp lead capture", "Priority support", "30-day money-back guarantee"],
                "restrictions": [],
            },
            {
                "name": "Scale", "description": "Advanced automation and white-glove setup for serious founders",
                "monthlyPrice": 4999, "badge": "Best Value", "buttonText": "Book Consultation", "buttonHref": "/contact",
                "target": "High-revenue solo businesses", "highlight": True,
                "features": ["Everything in Grow", "Done-for-you Genie setup session", "Advanced AI sales automation", "CRM & lead pipeline", "Custom AI Genie training on your business", "Multi-page site with blog", "White-label option", "Dedicated account manager", "Phone & video call support", "Lifetime community access"],
                "restrictions": [],
            },
        ],
        "faqs": [
            {"question": "Do I need technical skills to use OPC Genie?",  "answer": "None at all. You describe your business in plain English and your Genie handles everything — design, copy, setup, and automation."},
            {"question": "Can I use my own domain name?",                  "answer": "Yes, on the Grow and Scale plans you can connect any custom domain. Free plan gets an OPC Genie subdomain."},
            {"question": "What payment gateways are supported?",           "answer": "Razorpay, Stripe, and PayPal are supported on Grow and Scale plans. More gateways are being added regularly."},
            {"question": "Can I switch plans anytime?",                    "answer": "Absolutely. Upgrade or downgrade at any time — changes take effect immediately with prorated billing."},
            {"question": "What is the AI Genie trained on?",               "answer": "Your Genie is trained on your business description, your offers, your FAQs, and your past conversations so it always speaks in your voice."},
            {"question": "Is my business data private?",                   "answer": "Yes. Your data is never shared with other users or used to train models outside your account."},
            {"question": "What happens after the free trial?",             "answer": "You choose a paid plan or stay on the free tier — no automatic charges, no card required to start."},
        ],
    },
    "footerLinks": {
        "platform":  [{"name": "AI Website Builder", "href": "/platform/website-builder"}, {"name": "AI Genie", "href": "/platform/ai-genie"}, {"name": "Offers & Payments", "href": "/platform/offers"}, {"name": "Content Studio", "href": "/platform/content-studio"}, {"name": "Analytics", "href": "/dashboard"}, {"name": "Community", "href": "/community"}],
        "resources": [{"name": "Playbooks", "href": "/resources"}, {"name": "Blog", "href": "/blog"}, {"name": "Case Studies", "href": "/case-studies"}, {"name": "Help Center", "href": "/help"}, {"name": "Contact", "href": "/contact"}],
        "company":   [{"name": "About Us", "href": "/about"}, {"name": "Careers", "href": "/careers"}, {"name": "Press", "href": "/press"}, {"name": "Partners", "href": "/partners"}, {"name": "Contact", "href": "/contact"}],
    },
}

with engine.begin() as conn:
    for key, value in rows.items():
        exists = conn.execute(text("SELECT key FROM site_settings WHERE key = :k"), {"k": key}).fetchone()
        if exists:
            conn.execute(text("UPDATE site_settings SET value = :v, updated_at = now() WHERE key = :k"), {"v": json.dumps(value), "k": key})
            print(f"UPDATED: {key}")
        else:
            conn.execute(text("INSERT INTO site_settings (key, value, updated_at) VALUES (:k, :v, now())"), {"k": key, "v": json.dumps(value)})
            print(f"INSERTED: {key}")

print("Done.")
