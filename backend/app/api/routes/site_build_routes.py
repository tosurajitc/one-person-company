"""
site_build_routes.py

POST /api/sites/build  — receives the full buildSitePayload() JSON from the
                         setup wizard (schema 2.0) and kicks off site generation.

The actual site-generation work is intentionally kept async and decoupled:
the endpoint validates the payload, persists the raw JSON to user_site_settings
(key="site_build_payload", schema_version="2.0"), and returns a preview URL so
the frontend can poll or navigate immediately.  A real implementation would
enqueue a background job here; for now it returns a deterministic preview URL
derived from the requested subdomain.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import AuthService
from app.models.user import User
from app.models.user_site_settings import UserSiteSettings

logger = logging.getLogger(__name__)

router = APIRouter()

SCHEMA_VERSION = "2.0"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_user(request: Request, db: Session) -> Optional[User]:
    """Extract user from JWT cookie or Authorization header. Returns None for anonymous."""
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
    if not token:
        token = request.cookies.get("token")
    if not token:
        return None
    return AuthService.get_user_from_token(token, db)


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


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BuildRequest(BaseModel):
    """Full buildSitePayload() output from the setup wizard (schema 2.0)."""
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
    # Allow extra top-level keys without rejection
    class Config:
        extra = "allow"


class BuildResponse(BaseModel):
    success: bool
    previewUrl: Optional[str] = None
    message: str = ""
    saved: bool = False


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

    - Validates that the required fields (site.subdomain, business.brandName) are present.
    - Persists each domain group to user_site_settings for logged-in users.
    - Returns a previewUrl the frontend can navigate to immediately.
    """
    # Basic validation
    subdomain = (body.site.get("subdomain") or "").strip()
    brand_name = (body.business.get("brandName") or "").strip()
    if not subdomain and not brand_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="site.subdomain or business.brandName is required to build a site.",
        )
    if not subdomain:
        # Derive slug from brand name
        import re
        subdomain = re.sub(r'[^\w\s-]', '', brand_name.lower())
        subdomain = re.sub(r'[\s_-]+', '-', subdomain).strip('-')

    user = _get_current_user(request, db)
    saved = False

    if user is not None:
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
        try:
            db.commit()
            saved = True
            logger.info("Site build payload saved for user_id=%s subdomain=%s", user.id, subdomain)
        except Exception as exc:
            db.rollback()
            logger.error("Failed to save build payload for user %s: %s", user.id, exc)
            # Continue — return a URL even if the DB write fails

    preview_url = f"/{subdomain}"

    return BuildResponse(
        success=True,
        previewUrl=preview_url,
        message="Your site is being built. You'll be redirected to the preview shortly.",
        saved=saved,
    )
