"""
Rebuild site_build_payload for sharma-digital (user_id=3) from the current
genie_intake_draft, applying all programmatic defaults.

This script merges genie_intake_draft into the existing site_build_payload
so the public site at /sharma-digital picks up FAQs, social links, intro video,
invitation, process details, etc.

Usage:
  python scripts/rebuild_payload_sharma.py          -- dry run
  python scripts/rebuild_payload_sharma.py --write  -- apply to DB
"""
import sys, json, copy, argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.database import SessionLocal
from app.models.user_site_settings import UserSiteSettings
from app.api.routes.genie_routes import _apply_programmatic_defaults

USER_ID = 3

def _slugify(s):
    import re
    s = (s or "").lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s

def _num(v):
    if v == "" or v is None:
        return None
    try:
        return int(v)
    except (ValueError, TypeError):
        return None

def rebuild_payload(draft):
    """
    Convert genie_intake_draft (wizard schema) → site_build_payload (renderer schema).
    This mirrors buildSitePayload() in setup-wizard/page.js but runs server-side
    and uses the fully-defaulted draft.
    """
    d = draft
    market = (d.get("start") or {}).get("market", "india")
    currencies = (
        ["INR"] if market == "india"
        else ["USD"] if market == "global"
        else ["INR", "USD"]
    )

    # ── offers ────────────────────────────────────────────────────────────────
    tier_order = {"front_door": 1, "core": 2, "recurring": 3}
    raw_tiers = (d.get("offers") or {}).get("tiers") or []
    tiers = []
    for t in raw_tiers:
        if not (t or {}).get("name", "").strip():
            continue
        prices = {}
        if "INR" in currencies:
            prices["INR"] = _num(t.get("priceInr"))
        if "USD" in currencies:
            prices["USD"] = _num(t.get("priceUsd"))
        deliverables = t.get("deliverables") or ""
        if isinstance(deliverables, str):
            deliverables = [l.strip() for l in deliverables.split("\n") if l.strip()]
        tiers.append({
            "tier": t["tier"],
            "order": tier_order.get(t["tier"], 99),
            "name": t["name"].strip(),
            "slug": _slugify(t["name"]),
            "summary": t.get("summary") or "",
            "deliverables": deliverables,
            "duration": t.get("duration") or "",
            "billing": "monthly" if t["tier"] == "recurring" else "one_time",
            "prices": prices,
            "highlight": (d.get("offers") or {}).get("mostBought") == t["tier"],
        })

    # ── positioning sentence ──────────────────────────────────────────────────
    pos = d.get("positioning") or {}
    sentence = (
        f"I help {pos.get('buyer','')} who struggle with {pos.get('problem','')} "
        f"to get {pos.get('outcome','')}"
        + (f" within {pos['timeframe']}" if pos.get("timeframe") else "")
        + (f", without {pos['fear']}" if pos.get("fear") else "")
        + "."
    )

    # ── identity ──────────────────────────────────────────────────────────────
    identity = d.get("identity") or {}

    # ── knowledge ─────────────────────────────────────────────────────────────
    knowledge = d.get("knowledge") or {}
    faqs_raw = knowledge.get("faqs") or []
    faqs = [f for f in faqs_raw if f and f.get("question") and f.get("answer")]

    # ── channels.social — preserve ALL platforms (user-supplied + placeholders)
    social_raw = (d.get("channels") or {}).get("social") or {}
    # Only include non-empty URLs
    social = {k: v for k, v in social_raw.items() if v and v.strip()}

    # ── frontDoor ─────────────────────────────────────────────────────────────
    fd_raw = d.get("frontDoor") or {}
    # site_build_payload uses primaryAction (not primaryCta) and buttonLabel (not ctaLabel)
    front_door = {
        "primaryAction": fd_raw.get("primaryCta") or "book_call",
        "bookingUrl":    fd_raw.get("bookingUrl") or None,
        "buttonLabel":   fd_raw.get("ctaLabel") or None,
        "invitation":    fd_raw.get("invitation") or "",
        "responseTime":  fd_raw.get("responseTime") or "Within 1 business day",
        "workingHours":  fd_raw.get("workingHours") or "",
        "channels":      fd_raw.get("channels") or {"form": True, "whatsapp": True, "email": True, "booking": True},
        "formQuestions": [q for q in (fd_raw.get("formQuestions") or []) if q],
    }

    start = d.get("start") or {}
    site_cfg = d.get("site") or {}
    brand = d.get("brand") or {}
    proof = d.get("proof") or {}
    agents = d.get("agents") or {}
    payments_raw = d.get("payments") or {}

    slug = site_cfg.get("subdomain") or _slugify(identity.get("brandName") or "")

    payload = {
        "schemaVersion": "2.0",
        "template": "opc-template-v1",
        "createdAt": None,          # will be filled from existing payload

        "site": {
            "subdomain":    slug,
            "customDomain": site_cfg.get("customDomain") or None,
            "language":     start.get("language", "en"),
            "market":       market,
            "currencies":   currencies,
            "timezone":     identity.get("timezone") or "Asia/Kolkata",
            "notifyEmail":  site_cfg.get("notifyEmail") or identity.get("email") or "",
            "analyticsId":  site_cfg.get("analyticsId") or None,
            "pages": ["/", "/offers", "/offers/:tier", "/about", "/work",
                      "/insights", "/faq", "/contact", "/legal/*"],
        },

        "business": {
            "description": start.get("description") or "",
            "type":        start.get("businessType") or "consulting",
            "brandName":   identity.get("brandName") or "",
            "tagline":     identity.get("tagline") or None,
            "logoUrl":     identity.get("logoUrl") or None,
            "city":        identity.get("city") or "",
            "country":     identity.get("country") or "India",
            "owner": {
                "name":     identity.get("ownerName") or "",
                "role":     identity.get("ownerRole") or "",
                "photoUrl": identity.get("photoUrl") or None,
                "email":    identity.get("email") or "",
                "whatsapp": identity.get("whatsapp") or "",
            },
        },

        "positioning": {
            "sentence":     sentence,
            "buyer":        pos.get("buyer") or "",
            "problem":      pos.get("problem") or "",
            "outcome":      pos.get("outcome") or "",
            "timeframe":    pos.get("timeframe") or "",
            "fear":         pos.get("fear") or "",
            "alreadyTried": pos.get("alreadyTried") or "",
            "credibility":  pos.get("credibility") or "",
            "forWho":       [s for s in (pos.get("forWho") or []) if s],
            "notFor":       [s for s in (pos.get("notFor") or []) if s],
            "nicheScore":   pos.get("nicheScore") or {},
        },

        "offers": {
            "tiers":          tiers,
            "product":        None,
            "paymentTerms":   (d.get("offers") or {}).get("paymentTerms") or "50_50",
            "revisionRounds": (d.get("offers") or {}).get("revisionRounds") or "2",
            "priceDisplay":   (d.get("offers") or {}).get("priceDisplay") or "show",
        },

        "proof": {
            "yearsExperience": _num(proof.get("yearsExperience")),
            "clientsServed":   _num(proof.get("clientsServed")),
            "credentials":     [c for c in (proof.get("credentials") or []) if c],
            "results":         [r for r in (proof.get("results") or []) if r.get("number") and r.get("label")],
            "caseStudies":     [c for c in (proof.get("caseStudies") or []) if c.get("client") or c.get("result")],
            "testimonials":    [t for t in (proof.get("testimonials") or []) if isinstance(t, dict) and t.get("name") and t.get("quote")],
        },

        "frontDoor": front_door,

        "knowledge": {
            "process":      [s for s in (knowledge.get("process") or []) if s.get("title")],
            "included":     [s for s in (knowledge.get("included") or []) if s],
            "notIncluded":  [s for s in (knowledge.get("notIncluded") or []) if s],
            "refundPolicy": knowledge.get("refundPolicy") or None,
            "toolsUsed":    knowledge.get("toolsUsed") or "",
            "faqs":         faqs,
            "introVideo":   knowledge.get("introVideo") or {"url": "", "title": ""},
        },

        "brand": {
            "style":         brand.get("style") or "minimal",
            "tone":          brand.get("tone") or "plain",
            "primaryColor":  brand.get("primaryColor") or "#2563eb",
            "referenceSite": brand.get("referenceSite") or None,
            "avoidWords":    [w.strip() for w in (brand.get("avoidWords") or "").split(",") if w.strip()],
        },

        "agents": {
            "enabled":         (agents.get("enabled") or []),
            "autonomy":        agents.get("autonomy") or "draft_only",
            "guardrails":      agents.get("guardrails") or {},
            "monthlySpendCap": _num(agents.get("monthlySpendCap")),
            "facebook":        agents.get("facebook") or {},
        },

        "payments": {
            "gateways":      payments_raw.get("gateways") or [],
            "structure":     payments_raw.get("structure") or "sole_proprietor",
            "legalName":     payments_raw.get("legalName") or identity.get("brandName") or "",
            "gstRegistered": payments_raw.get("gstRegistered") or "no",
            "gstin":         payments_raw.get("gstin") if payments_raw.get("gstRegistered") == "yes" else None,
            "exportClients": payments_raw.get("exportClients") == "yes",
            "lutFiled":      payments_raw.get("lutFiled") if payments_raw.get("exportClients") == "yes" else None,
            "invoicePrefix": payments_raw.get("invoicePrefix") or "INV-",
            "legalPages":    payments_raw.get("legalPages") or {"terms": True, "privacy": True, "refund": True},
        },

        "channels": {
            "social":        social,
            "mainPlatform":  (d.get("channels") or {}).get("mainPlatform") or "linkedin",
            "cadence":       (d.get("channels") or {}).get("cadence") or "weekly",
            "newsletter":    bool((d.get("channels") or {}).get("newsletter")),
            "contentTopics": [t for t in ((d.get("channels") or {}).get("contentTopics") or []) if t],
            "publishedWork": [w for w in ((d.get("channels") or {}).get("publishedWork") or []) if w.get("title") and w.get("url")],
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

    return payload


def main(write: bool):
    db = SessionLocal()
    try:
        rows = db.query(UserSiteSettings).filter(UserSiteSettings.user_id == USER_ID).all()
        row_map = {r.key: r for r in rows}

        draft_row   = row_map.get("genie_intake_draft")
        payload_row = row_map.get("site_build_payload")

        if not draft_row:
            print("ERROR: no genie_intake_draft row"); return

        # Apply programmatic defaults first so draft is fully populated
        draft = _apply_programmatic_defaults(copy.deepcopy(draft_row.value))

        new_payload = rebuild_payload(draft)

        # Preserve original createdAt if available
        if payload_row and payload_row.value and payload_row.value.get("createdAt"):
            new_payload["createdAt"] = payload_row.value["createdAt"]
        else:
            from datetime import datetime, timezone
            new_payload["createdAt"] = datetime.now(timezone.utc).isoformat()

        print("\n=== NEW site_build_payload (key sections) ===")
        print(f"knowledge.faqs:       {len(new_payload['knowledge']['faqs'])} items")
        print(f"knowledge.introVideo: {new_payload['knowledge']['introVideo']}")
        print(f"knowledge.refundPolicy: {new_payload['knowledge']['refundPolicy']}")
        print(f"knowledge.included:   {new_payload['knowledge']['included']}")
        print(f"knowledge.notIncluded:{new_payload['knowledge']['notIncluded']}")
        print(f"knowledge.process[0]: {new_payload['knowledge']['process'][0]}")
        print(f"frontDoor.buttonLabel:{new_payload['frontDoor']['buttonLabel']}")
        print(f"frontDoor.invitation: {new_payload['frontDoor']['invitation']}")
        print(f"channels.social:      {json.dumps(new_payload['channels']['social'], ensure_ascii=False)}")
        print(f"offers.tiers:         {len(new_payload['offers']['tiers'])} tiers")
        for t in new_payload['offers']['tiers']:
            print(f"  - {t['name']} ({t['tier']}) prices={t['prices']}")
        print(f"positioning.buyer:    {new_payload['positioning']['buyer']}")
        print()

        if not write:
            print("DRY RUN — pass --write to apply.")
            return

        if payload_row:
            payload_row.value = new_payload
            payload_row.schema_version = "2.0"
        else:
            db.add(UserSiteSettings(user_id=USER_ID, key="site_build_payload", value=new_payload, schema_version="2.0"))

        db.commit()
        print("WRITTEN — site_build_payload rebuilt for sharma-digital.")
        print("Visit /sharma-digital to see the updated site.")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    main(write=args.write)
