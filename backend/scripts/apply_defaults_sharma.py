"""
Backfill script: apply _apply_programmatic_defaults to the sharma-digital
user (user_id=3) for ALL relevant user_site_settings rows.

Usage:
  python scripts/apply_defaults_sharma.py          -- dry run (print diff)
  python scripts/apply_defaults_sharma.py --write  -- apply to DB
"""
import sys
import json
import copy
import argparse
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.models.user_site_settings import UserSiteSettings
from app.api.routes.genie_routes import _apply_programmatic_defaults

USER_ID = 3  # tosurajitc@gmail.com / sharma-digital

V2_GROUPS = ("start", "identity", "positioning", "offers", "proof",
             "frontDoor", "knowledge", "brand", "agents", "payments",
             "channels", "site")


def main(write: bool):
    db = SessionLocal()
    try:
        rows = db.query(UserSiteSettings).filter(UserSiteSettings.user_id == USER_ID).all()
        row_map = {r.key: r for r in rows}

        # ── 1. Read the full wizard state from genie_intake_draft ────────────
        draft_row = row_map.get("genie_intake_draft")
        if not draft_row:
            print("ERROR: no genie_intake_draft row found for user_id=3")
            sys.exit(1)

        draft = copy.deepcopy(draft_row.value)
        updated = _apply_programmatic_defaults(draft)

        # ── 2. Show diff ─────────────────────────────────────────────────────
        def changed(key, sub=None):
            old = draft.get(key) if sub is None else (draft.get(key) or {}).get(sub)
            new = updated.get(key) if sub is None else (updated.get(key) or {}).get(sub)
            if old != new:
                return old, new
            return None

        print("=" * 60)
        print(f"Sharma Digital (user_id={USER_ID}) — programmatic defaults diff")
        print("=" * 60)

        checks = [
            ("knowledge", "faqs",        lambda v: f"{len(v)} FAQs" if isinstance(v, list) else str(v)),
            ("knowledge", "introVideo",  lambda v: json.dumps(v)),
            ("knowledge", "refundPolicy",lambda v: v),
            ("knowledge", "included",    lambda v: json.dumps(v)),
            ("knowledge", "notIncluded", lambda v: json.dumps(v)),
            ("knowledge", "process",     lambda v: f"{len(v)} steps, first detail={v[0].get('detail') if v else '?'}"),
            ("frontDoor", "ctaLabel",    lambda v: v),
            ("frontDoor", "invitation",  lambda v: v),
            ("channels",  "social",      lambda v: json.dumps(v, ensure_ascii=False)),
        ]

        any_change = False
        for group, field, fmt in checks:
            result = changed(group, field)
            if result:
                old_val, new_val = result
                print(f"\n  [{group}.{field}]")
                print(f"    BEFORE: {fmt(old_val) if old_val is not None else '(missing)'}")
                print(f"    AFTER:  {fmt(new_val)}")
                any_change = True

        if not any_change:
            print("\nNo changes needed — all fields already populated.")
            return

        print()
        if not write:
            print("DRY RUN — no changes written. Pass --write to apply.")
            return

        # ── 3. Write back ────────────────────────────────────────────────────
        # Update genie_intake_draft with the fully-defaulted state
        draft_row.value = updated
        draft_row.schema_version = "2.0"

        # Also update each domain group row so they match
        for group_key in V2_GROUPS:
            if group_key in updated:
                group_row = row_map.get(group_key)
                if group_row:
                    group_row.value = updated[group_key]
                    group_row.schema_version = "2.0"
                else:
                    db.add(UserSiteSettings(
                        user_id=USER_ID,
                        key=group_key,
                        value=updated[group_key],
                        schema_version="2.0",
                    ))

        db.commit()
        print("WRITTEN — all rows updated for sharma-digital (user_id=3).")

        # ── 4. Print final state of knowledge ───────────────────────────────
        print("\n--- Final knowledge ---")
        k = updated.get("knowledge", {})
        print(f"  faqs ({len(k.get('faqs', []))} items):")
        for f in k.get("faqs", []):
            print(f"    Q: {f['question']}")
            print(f"    A: {f['answer']}")
        print(f"  introVideo: {k.get('introVideo')}")
        print(f"  refundPolicy: {k.get('refundPolicy')}")
        print(f"  included: {k.get('included')}")
        print(f"  notIncluded: {k.get('notIncluded')}")
        print(f"  process[0].detail: {k.get('process', [{}])[0].get('detail')}")
        print("\n--- Final frontDoor ---")
        fd = updated.get("frontDoor", {})
        print(f"  ctaLabel: {fd.get('ctaLabel')}")
        print(f"  invitation: {fd.get('invitation')}")
        print("\n--- Final channels.social ---")
        print(json.dumps(updated.get("channels", {}).get("social", {}), indent=4))

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="Apply changes to the database")
    args = parser.parse_args()
    main(write=args.write)
