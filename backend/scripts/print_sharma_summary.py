"""
Print a readable summary of the sharma-digital site data for manual review.
"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.database import SessionLocal
from app.models.user_site_settings import UserSiteSettings

db = SessionLocal()
rows = db.query(UserSiteSettings).filter(UserSiteSettings.user_id == 3).all()
draft = next((r.value for r in rows if r.key == "genie_intake_draft"), {})
db.close()

print("=" * 60)
print("SHARMA DIGITAL — site data summary")
print("=" * 60)

id_ = draft.get("identity", {})
print(f"\nBrand:      {id_.get('brandName')}  ({id_.get('ownerName')}, {id_.get('ownerRole')})")
print(f"Location:   {id_.get('city')}, {id_.get('country')}")
print(f"Email:      {id_.get('email')}   WhatsApp: {id_.get('whatsapp')}")

pos = draft.get("positioning", {})
print(f"\nPositioning: I help {pos.get('buyer')} who struggle with {pos.get('problem')}")
print(f"             to get {pos.get('outcome')}.")

fd = draft.get("frontDoor", {})
print(f"\nFront door:  CTA={fd.get('primaryCta')}  Label='{fd.get('ctaLabel')}'")
print(f"             Invitation: {fd.get('invitation')}")

k = draft.get("knowledge", {})
print(f"\nProcess ({len(k.get('process', []))} steps):")
for s in k.get("process", []):
    print(f"  - {s['title']}: {s['detail']}")

print(f"\nIncluded:")
for item in k.get("included", []):
    print(f"  + {item}")
print(f"Not included:")
for item in k.get("notIncluded", []):
    print(f"  - {item}")

print(f"\nRefund policy: {k.get('refundPolicy')}")
print(f"\nIntro video:   {k.get('introVideo')}")

print(f"\nFAQs ({len(k.get('faqs', []))}):")
for faq in k.get("faqs", []):
    print(f"  Q: {faq['question']}")
    print(f"  A: {faq['answer']}")
    print()

social = draft.get("channels", {}).get("social", {})
print("Social links:")
for platform, url in social.items():
    status = "(user-supplied)" if "aditisharma" in url else "(placeholder)" if url else "(blank)"
    print(f"  {platform:<16} {url or '(empty)'}  {status}")
