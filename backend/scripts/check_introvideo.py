import sys, json
sys.path.insert(0, 'one-person-company/backend')
from app.core.database import SessionLocal
from app.models.user_site_settings import UserSiteSettings
db = SessionLocal()
rows = db.query(UserSiteSettings).filter(UserSiteSettings.user_id == 3).all()
data = {r.key: r.value for r in rows}
db.close()

print("=== knowledge group row (read by /api/settings/mine) ===")
k = data.get('knowledge', {})
print("keys:", sorted(k.keys()))
print("introVideo:", json.dumps(k.get('introVideo')))

print()
print("=== genie_intake_draft.knowledge ===")
dk = data.get('genie_intake_draft', {}).get('knowledge', {})
print("introVideo:", json.dumps(dk.get('introVideo')))

print()
print("=== site_build_payload.knowledge (live site reads this) ===")
pk = data.get('site_build_payload', {}).get('knowledge', {})
print("introVideo:", json.dumps(pk.get('introVideo')))
