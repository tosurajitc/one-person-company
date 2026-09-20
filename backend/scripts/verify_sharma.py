"""
Verify the sharma-digital (user_id=3) site settings are complete after backfill.
Checks every field that should never be blank.
"""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.models.user_site_settings import UserSiteSettings

USER_ID = 3

CHECKS = [
    # (description, group_key, subkey_or_None, expect_non_blank)
    ("FAQ count >= 5",       "knowledge", "faqs",         lambda v: isinstance(v, list) and len(v) >= 5),
    ("FAQ[0].question",      "knowledge", "faqs",         lambda v: bool(v and v[0].get("question"))),
    ("FAQ[0].answer",        "knowledge", "faqs",         lambda v: bool(v and v[0].get("answer"))),
    ("introVideo.url",       "knowledge", "introVideo",   lambda v: bool(v and v.get("url"))),
    ("introVideo.title",     "knowledge", "introVideo",   lambda v: bool(v and v.get("title"))),
    ("refundPolicy",         "knowledge", "refundPolicy", lambda v: bool(v and v.strip())),
    ("included[0]",          "knowledge", "included",     lambda v: isinstance(v, list) and len(v) > 0),
    ("notIncluded[0]",       "knowledge", "notIncluded",  lambda v: isinstance(v, list) and len(v) > 0),
    ("process[0].detail",    "knowledge", "process",      lambda v: bool(v and v[0].get("detail"))),
    ("ctaLabel",             "frontDoor", "ctaLabel",     lambda v: bool(v and v.strip())),
    ("invitation",           "frontDoor", "invitation",   lambda v: bool(v and v.strip())),
    ("social.linkedin",      "channels",  "social",       lambda v: bool(v and v.get("linkedin"))),
    ("social.instagram",     "channels",  "social",       lambda v: bool(v and v.get("instagram"))),
    ("social.facebook",      "channels",  "social",       lambda v: bool(v and v.get("facebook"))),
    ("social.youtube",       "channels",  "social",       lambda v: bool(v and v.get("youtube"))),
    ("social.x",             "channels",  "social",       lambda v: bool(v and v.get("x"))),
    ("identity.brandName",   "identity",  "brandName",    lambda v: bool(v and v.strip())),
    ("identity.ownerName",   "identity",  "ownerName",    lambda v: bool(v and v.strip())),
    ("identity.email",       "identity",  "email",        lambda v: bool(v and v.strip())),
    ("positioning.buyer",    "positioning","buyer",        lambda v: bool(v and v.strip())),
    ("positioning.problem",  "positioning","problem",      lambda v: bool(v and v.strip())),
    ("positioning.outcome",  "positioning","outcome",      lambda v: bool(v and v.strip())),
    ("offers.tiers[0].name", "offers",    "tiers",        lambda v: bool(v and v[0].get("name"))),
    ("offers.tiers[1].name", "offers",    "tiers",        lambda v: bool(v and len(v) > 1 and v[1].get("name"))),
]

db = SessionLocal()
try:
    rows = db.query(UserSiteSettings).filter(UserSiteSettings.user_id == USER_ID).all()
    # Use genie_intake_draft as the unified source of truth
    draft = next((r.value for r in rows if r.key == "genie_intake_draft"), {})

    passed = 0
    failed = 0
    print(f"\n{'Field':<28} {'Status':<8} Value preview")
    print("-" * 80)
    for desc, group, subkey, check in CHECKS:
        group_data = draft.get(group) or {}
        value = group_data.get(subkey)
        ok = check(value)
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        preview = ""
        if isinstance(value, list):
            preview = f"[{len(value)} items]" if value else "[]"
        elif isinstance(value, dict):
            preview = json.dumps(value)[:60]
        elif isinstance(value, str):
            preview = value[:60]
        print(f"  {desc:<26} {status:<8} {preview}")

    print("-" * 80)
    print(f"\n  {passed} passed, {failed} failed\n")

    if failed == 0:
        print("All checks passed. sharma-digital data is complete.")
    else:
        print("Some fields still missing. Re-run apply_defaults_sharma.py --write")

finally:
    db.close()
