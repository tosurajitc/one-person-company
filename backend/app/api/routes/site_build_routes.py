"""
site_build_routes.py

POST /api/sites/build  — receives the full buildSitePayload() JSON from the
                         setup wizard (schema 2.0) and creates/updates the
                         founder's site.

Phase 1 changes from the original version of this file:
  - Login is now required. Before, an anonymous build silently saved
    nothing and still returned success=True, which was misleading.
  - The site slug is checked against reserved_names.py before anything is
    saved, so a founder can no longer claim a slug that collides with a
    top-level route, another founder's username, or a slug someone else
    used before.
  - A founder_sites row is now created on first build, and updated (with
    the old slug preserved in founder_site_slug_history) on later builds.
  - A failed database commit now returns a real error to the caller
    instead of being logged and silently ignored.
  - The wizard's pricing tiers (offers.tiers) are now synced into real
    Offer rows via offer_sync_service.py, linked to the founder's site.

The actual site-generation work is still intentionally kept async and
decoupled: this endpoint validates the payload, persists the raw JSON to
user_site_settings (key="site_build_payload", schema_version="2.0"), and
returns a preview URL so the frontend can poll or navigate immediately.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import AuthService
from app.models.user import User
from app.models.user_site_settings import UserSiteSettings
from app.models.founder_site import FounderSite, FounderSiteSlugHistory
from app.services.reserved_names import is_available
from app.services.offer_sync_service import sync_offers_from_wizard

logger = logging.getLogger(__name__)

router = APIRouter()

SCHEMA_VERSION = "2.0"
DEFAULT_THEME = "professional"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_user_required(request: Request, db: Session) -> User:
    """
    Extract user from JWT cookie or Authorization header.
    Raises 401 if there is no valid, active user — site building now
    always requires login.
    """
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
    if not token:
        token = request.cookies.get("token")

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required to build a site.")

    user = AuthService.get_user_from_token(token, db)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required to build a site.")

    return user


def _upsert_setting(db: Session, user_id: int, key: str, value: Any) -> None:
    row = (
        db.query(UserSiteSettings)
        .filter(UserSiteSettings.user_id == user_id, UserSiteSettings.key == key)
        .first()
    )
    if row:
        row.value = value
        row.schema_version = SCHEMA_VERSION
    else:
        db.add(UserSiteSettings(user_id=user_id, key=key, value=value, schema_version=SCHEMA_VERSION))


def _derive_slug(subdomain: str, brand_name: str) -> str:
    """Use the wizard's chosen subdomain if given, else slugify the brand name."""
    slug = (subdomain or "").strip().lower()
    if slug:
        return slug
    slug = re.sub(r"[^\w\s-]", "", (brand_name or "").lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
    return slug


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BuildRequest(BaseModel):
    """Full buildSitePayload() output from the setup wizard (schema 2.0)."""
    model_config = ConfigDict(extra="allow")  # allow extra top-level keys without rejection

    schemaVersion: str = SCHEMA_VERSION
    template: str = "opc-template-v1"
    site: Dict[str, Any] = {}
    business: Dict[str, Any] = {}
    positioning: Dict[str, Any] = {}
    offers: Dict[str, Any] = {}
    proof: Dict[str, Any] = {}
    frontDoor: Dict[str, Any] = {}
    knowledge: Dict[str, Any] = {}
    brand: Dict[str, Any] = {}
    agents: Dict[str, Any] = {}
    payments: Dict[str, Any] = {}
    channels: Dict[str, Any] = {}
    generation: Dict[str, Any] = {}


class BuildResponse(BaseModel):
    success: bool
    previewUrl: Optional[str] = None
    message: str = ""
    saved: bool = False
    slug: Optional[str] = None


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/sites/build", response_model=BuildResponse)
async def build_site(
    body: BuildRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receive the full schema 2.0 site payload from the setup wizard.

    - Requires login.
    - Validates that site.subdomain or business.brandName is present.
    - Checks the resulting slug against reserved_names.py.
    - Creates or updates the founder_sites row, keeping slug history.
    - Syncs offers.tiers into Offer rows via offer_sync_service.py.
    - Persists each domain group to user_site_settings.
    - Returns a previewUrl the frontend can navigate to immediately.
    """
    user = _get_current_user_required(request, db)

    subdomain = (body.site.get("subdomain") or "").strip()
    brand_name = (body.business.get("brandName") or "").strip()
    if not subdomain and not brand_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="site.subdomain or business.brandName is required to build a site.",
        )

    slug = _derive_slug(subdomain, brand_name)
    if not slug:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not derive a valid site address from the information given.",
        )

    # A founder can keep their own existing slug across rebuilds, so exclude
    # their own current site/username from the "already taken" checks.
    existing_site = db.query(FounderSite).filter(FounderSite.user_id == user.id).first()

    ok, reason = is_available(
        slug,
        db=db,
        exclude_user_id=user.id,
        check_site_slug=True,
    )
    # If the slug is unchanged from the founder's own current site, that is
    # always fine even though is_available() would otherwise say "taken"
    # (it correctly still blocks *other* founders from reusing it).
    slug_is_unchanged = existing_site is not None and existing_site.slug == slug
    if not ok and not slug_is_unchanged:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=reason)

    requested_theme = (body.site.get("theme") or "").strip().lower() or None

    try:
        if existing_site is None:
            existing_site = FounderSite(
                user_id=user.id,
                slug=slug,
                theme=requested_theme or DEFAULT_THEME,
                status="draft",
            )
            db.add(existing_site)
        else:
            if existing_site.slug != slug:
                db.add(FounderSiteSlugHistory(founder_site_id=existing_site.id, old_slug=existing_site.slug))
                existing_site.slug = slug
            if requested_theme:
                existing_site.theme = requested_theme

        # A brand-new founder_sites row doesn't have an id until it's been
        # flushed to the database. Offers need that id (founder_site_id),
        # so flush now -- this is not a commit, it's still inside the same
        # transaction and still fully rolled back together on any error.
        db.flush()

        # Turn the wizard's pricing tiers into real Offer rows, matched by
        # (creator, tier) so re-submitting the wizard updates the same
        # offers instead of duplicating them. Never deletes an offer.
        sync_offers_from_wizard(db, user, body.offers, founder_site=existing_site)

        # Persist the full build payload split into domain groups so the wizard
        # can reload it via GET /api/settings/mine.
        payload_dict = body.model_dump()
        for group_key in ("site", "business", "positioning", "offers", "proof",
                          "frontDoor", "knowledge", "brand", "agents", "payments",
                          "channels", "generation"):
            value = payload_dict.get(group_key)
            if value:
                _upsert_setting(db, user.id, group_key, value)
        # Also store the complete raw payload for the site generator
        _upsert_setting(db, user.id, "site_build_payload", payload_dict)

        db.commit()
        db.refresh(existing_site)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to save site build for user %s: %s", user.id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save your site. Please try again.",
        )

    logger.info("Site build saved for user_id=%s slug=%s", user.id, slug)

    return BuildResponse(
        success=True,
        previewUrl=f"/{slug}",
        message="Your site is being built. You'll be redirected to the preview shortly.",
        saved=True,
        slug=slug,
    )


# ---------------------------------------------------------------------------
# Public site preview
# ---------------------------------------------------------------------------

@router.get("/sites/public/{slug}")
async def get_public_site(slug: str, db: Session = Depends(get_db)):
    """
    Public endpoint — returns the full site_build_payload for a given slug.
    No authentication required; used by the /[username] frontend page.
    Returns 404 if no founder_sites row matches the slug.
    """
    site = db.query(FounderSite).filter(FounderSite.slug == slug).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No site found for '{slug}'.")

    payload_row = (
        db.query(UserSiteSettings)
        .filter(
            UserSiteSettings.user_id == site.user_id,
            UserSiteSettings.key == "site_build_payload",
        )
        .first()
    )
    if not payload_row or not payload_row.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site data not yet available. The build may still be processing.",
        )

    return {
        "slug": site.slug,
        "theme": site.theme,
        "status": site.status,
        "payload": payload_row.value,
    }