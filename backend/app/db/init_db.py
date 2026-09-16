import logging

import copy

from app.core.database import Base   # all models register on this Base
from app.db.session import engine, SessionLocal

logger = logging.getLogger(__name__)


def init_db() -> None:
    """Initialize the database by creating all tables and seeding defaults."""
    # ── 1. Import every model so SQLAlchemy registers them before create_all ──
    from app.models.user import User          # noqa: F401
    from app.models.lead import Lead          # noqa: F401
    from app.models.chat import ChatMessage   # noqa: F401
    from app.models.subscription import UserSubscription, Payment  # noqa: F401
    from app.models.offer import Offer        # noqa: F401
    from app.models.community import (        # noqa: F401
        Community, CommunityThread, CommunityPost,
        CommunityMember, CommunityEvent, CommunitySettings, CommunityTemplate,
    )
    from app.models.agent_session import AgentSession, AgentSessionMessage  # noqa: F401
    try:
        from app.models.contact import Contact    # noqa: F401
    except Exception:
        pass
    try:
        from app.models.site_settings import SiteSetting  # noqa: F401
    except Exception:
        pass
    try:
        from app.models.course import Course      # noqa: F401
    except Exception:
        pass

    # ── 2. Create tables ──
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    # ── 3. Seed default site settings (only inserts missing rows) ──
    try:
        from app.api.routes.settings_routes import seed_default_settings
        db = SessionLocal()
        try:
            seed_default_settings(db)
            logger.info("Site settings seeded successfully")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error seeding site settings: {str(e)}")
        # Non-fatal — tables exist, seeding can be retried

    # ── 4. One-time migration: fix all stale CTA hrefs to /setup-wizard ──
    try:
        from app.models.site_settings import SiteSetting
        db = SessionLocal()
        try:
            _migrate_cta_hrefs(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error migrating CTA hrefs: {str(e)}")


# Hrefs that must be rewritten to /setup-wizard wherever they appear in the DB
_STALE_HREFS = {"/signup", "/admin/setup-wizard", "/get_started"}


def _fix_href(value: str) -> str:
    return "/setup-wizard" if value in _STALE_HREFS else value


def _migrate_cta_hrefs(db) -> None:
    """
    Rewrites every stale CTA href (/signup, /admin/setup-wizard, /get_started)
    to /setup-wizard in the hero, cta, pricing, and marketing_page DB rows.
    Safe to run on every startup — only writes when a change is actually needed.
    """
    from app.models.site_settings import SiteSetting
    from sqlalchemy.orm.attributes import flag_modified

    keys_to_patch = ["hero", "cta", "pricing", "marketing_page"]

    for key in keys_to_patch:
        row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
        if row is None or row.value is None:
            continue

        patched = copy.deepcopy(row.value)
        changed = False

        if key == "hero":
            try:
                href = patched["cta"]["primary"]["href"]
                new = _fix_href(href)
                if new != href:
                    patched["cta"]["primary"]["href"] = new
                    changed = True
            except (KeyError, TypeError):
                pass

        elif key == "cta":
            try:
                href = patched["primary"]["href"]
                new = _fix_href(href)
                if new != href:
                    patched["primary"]["href"] = new
                    changed = True
            except (KeyError, TypeError):
                pass

        elif key == "pricing":
            try:
                for plan in patched.get("plans", []):
                    href = plan.get("buttonHref", "")
                    new = _fix_href(href)
                    if new != href:
                        plan["buttonHref"] = new
                        changed = True
            except (KeyError, TypeError):
                pass

        elif key == "marketing_page":
            try:
                href = patched["hero"]["cta_href"]
                new = _fix_href(href)
                if new != href:
                    patched["hero"]["cta_href"] = new
                    changed = True
            except (KeyError, TypeError):
                pass

        if changed:
            row.value = patched
            flag_modified(row, "value")

    db.commit()
    logger.info("CTA href migration complete")