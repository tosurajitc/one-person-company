"""
Print what the /api/sites/public/sharma-digital endpoint actually returns
— the site_build_payload — and show which sections are blank.
"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.database import SessionLocal
from app.models.user_site_settings import UserSiteSettings

db = SessionLocal()
rows = db.query(UserSiteSettings).filter(UserSiteSettings.user_id == 3).all()
row_map = {r.key: r.value for r in rows}
db.close()

payload = row_map.get("site_build_payload", {})
draft   = row_map.get("genie_intake_draft", {})

print("=" * 70)
print("site_build_payload (what /sharma-digital actually renders)")
print("=" * 70)
print(json.dumps(payload, indent=2, ensure_ascii=False))
print()
print("=" * 70)
print("genie_intake_draft knowledge section (what we updated)")
print("=" * 70)
print(json.dumps(draft.get("knowledge", {}), indent=2, ensure_ascii=False))
print()
print("=" * 70)
print("genie_intake_draft channels section")
print("=" * 70)
print(json.dumps(draft.get("channels", {}), indent=2, ensure_ascii=False))
