"""
Script to fix the missing/empty subdomain in user_site_settings for user_id=3.
Updates both the individual 'site' row and the 'site' sub-object inside 'genie_intake_draft'.
"""
import sys
import copy
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.models.user_site_settings import UserSiteSettings

USER_ID = 3
SUBDOMAIN = "sharma-digital"
EMAIL = "aditi@sharmadigital.in"

def main():
    db = SessionLocal()
    try:
        # Fetch the settings rows
        rows = db.query(UserSiteSettings).filter(UserSiteSettings.user_id == USER_ID).all()
        row_map = {r.key: r for r in rows}

        site_row = row_map.get("site")
        draft_row = row_map.get("genie_intake_draft")

        print("=" * 60)
        print("Before update:")
        print("=" * 60)

        if site_row:
            print(f"site row value: {site_row.value}")
        else:
            print("site row: (missing)")

        if draft_row:
            draft_site = draft_row.value.get("site") or {}
            print(f"genie_intake_draft.site value: {draft_site}")
        else:
            print("genie_intake_draft row: (missing)")

        # Perform the update
        updated_any = False

        if site_row:
            site_val = copy.deepcopy(site_row.value)
            site_val["subdomain"] = SUBDOMAIN
            site_val["notifyEmail"] = EMAIL
            site_row.value = site_val
            db.add(site_row)
            updated_any = True
        else:
            new_site_row = UserSiteSettings(
                user_id=USER_ID,
                key="site",
                value={
                    "subdomain": SUBDOMAIN,
                    "analyticsId": "",
                    "notifyEmail": EMAIL,
                    "customDomain": ""
                },
                schema_version="2.0"
            )
            db.add(new_site_row)
            updated_any = True

        if draft_row:
            draft_val = copy.deepcopy(draft_row.value)
            if "site" not in draft_val:
                draft_val["site"] = {}
            draft_val["site"]["subdomain"] = SUBDOMAIN
            draft_val["site"]["notifyEmail"] = EMAIL
            draft_row.value = draft_val
            db.add(draft_row)
            updated_any = True

        if updated_any:
            db.commit()
            print("\n" + "=" * 60)
            print("After update:")
            print("=" * 60)

            # Re-fetch or print values
            db.refresh(site_row) if site_row else None
            db.refresh(draft_row) if draft_row else None

            if site_row:
                print(f"site row value: {site_row.value}")
            if draft_row:
                print(f"genie_intake_draft.site value: {draft_row.value.get('site')}")

            print("\nDatabase committed successfully!")
        else:
            print("\nNo rows to update.")

    except Exception as e:
        db.rollback()
        print(f"Error occurred: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
