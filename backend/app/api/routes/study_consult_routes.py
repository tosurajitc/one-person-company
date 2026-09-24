"""Study-abroad consultation requests (V1).

Public:  POST /api/study-consult/submit          (add this EXACT path to PUBLIC_ROUTES)
Owner:   GET  /api/study-consult/mine
         GET  /api/study-consult/{id}
         PATCH /api/study-consult/{id}

Requests are validated against the target site's OWN configuration
(consultation types, enabled pre-screen fields, custom questions), so a visitor
cannot inject fields the consultant never asked for.

ASSUMPTIONS to confirm against the real code (see WIRING.md):
  - UserSiteSettings has columns user_id, key, value (JSONB), schema_version
  - the site's config lives in the row key='site_build_payload', schema_version='2.0',
    with the template data under value['template_data']
  - FounderSite has id, user_id, slug, status
  - core.dependencies.get_current_user returns an object with .id
"""
from __future__ import annotations

import hashlib
import ipaddress
import json
import logging
import os
import secrets
import socket
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.consult_request import ConsultRequest
from ...models.founder_site import FounderSite
from ...models.user_site_settings import UserSiteSettings
from ...services import study_abroad_rules as rules

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/study-consult", tags=["study-consult"])

# Only published sites accept requests. Change to ("published", "draft") while testing
# if your build route does not set status to "published" yet.
ACCEPTING_STATUSES = ("published",)

MAX_BODY_CHARS = 20_000
DUPLICATE_WINDOW = timedelta(minutes=10)

# ---------------------------------------------------------------------------
# Small in-process rate limit (per IP). The auth middleware also rate-limits; this is a second guard.
# It is per worker process, so treat it as a brake, not a guarantee.
# ---------------------------------------------------------------------------
_RATE_WINDOW_S = 600
_RATE_MAX = 5
_hits: dict[str, deque] = defaultdict(deque)
_hits_lock = threading.Lock()


def _rate_limited(ip: str) -> bool:
    if os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "false":
        return False
    now = time.monotonic()
    with _hits_lock:
        q = _hits[ip]
        while q and now - q[0] > _RATE_WINDOW_S:
            q.popleft()
        if len(q) >= _RATE_MAX:
            return True
        q.append(now)
        return False


def _client_ip(request: Request) -> str:
    # Behind nginx the first X-Forwarded-For entry is the client. Only trust it if nginx sets it.
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _ip_hash(ip: str) -> str:
    salt = os.getenv("SECRET_KEY", "")
    return hashlib.sha256(f"{salt}:{ip}".encode()).hexdigest()


# ---------------------------------------------------------------------------
# Schemas (Pydantic v2)
# ---------------------------------------------------------------------------
class ConsentIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    accepted: bool
    policy_version: str = Field(default="", max_length=64)


class PreferredWindowIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: str | None = Field(default=None, max_length=10)
    part_of_day: str | None = Field(default=None, max_length=20)


class SubmitIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    site_slug: str = Field(min_length=3, max_length=100)
    consultation_type: str = Field(min_length=1, max_length=64)
    mode: str | None = Field(default=None, max_length=32)
    preferred_window: PreferredWindowIn | None = None
    timezone: str | None = Field(default=None, max_length=64)
    profile: dict[str, Any] = Field(default_factory=dict)
    custom: dict[str, Any] = Field(default_factory=dict)
    consent: ConsentIn
    website: str | None = Field(default=None, max_length=200)  # honeypot: humans leave it empty


class UpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["new", "qualified", "consultation_booked", "closed"] | None = None
    owner_notes: str | None = Field(default=None, max_length=4000)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _load_template_data(db: Session, site: FounderSite) -> dict | None:
    row = (
        db.query(UserSiteSettings)
        .filter(
            UserSiteSettings.user_id == site.user_id,
            UserSiteSettings.key == "site_build_payload",
            UserSiteSettings.schema_version == "2.0",
        )
        .first()
    )
    if not row or not isinstance(row.value, dict):
        return None
    td = row.value.get("template_data")
    return td if isinstance(td, dict) else None


def _new_ref(db: Session) -> str:
    for _ in range(5):
        ref = "SC-" + secrets.token_hex(3).upper()
        if not db.query(ConsultRequest.id).filter(ConsultRequest.ref == ref).first():
            return ref
    raise HTTPException(status_code=500, detail="Could not create a reference. Please try again.")


def _is_safe_webhook(url: str) -> bool:
    """https only, and the host must not resolve to a private or local address (SSRF guard)."""
    try:
        u = urlparse(url)
        if u.scheme != "https" or not u.hostname:
            return False
        for info in socket.getaddrinfo(u.hostname, u.port or 443, proto=socket.IPPROTO_TCP):
            ip = ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False
        return True
    except Exception:  # noqa: BLE001 - any resolution failure means "do not call"
        return False


def _post_webhook(request_id: int, url: str, payload: dict) -> None:
    """Runs in a background thread. Records the outcome on the row; never raises."""
    from ...core.database import SessionLocal  # local import: separate session for the thread

    status = "failed"
    try:
        if _is_safe_webhook(url):
            r = httpx.post(url, json=payload, timeout=5.0, follow_redirects=False)
            status = "sent" if 200 <= r.status_code < 300 else "failed"
        else:
            status = "skipped"
    except Exception:  # noqa: BLE001
        logger.warning("consult webhook failed for request %s", request_id, exc_info=True)
    db = SessionLocal()
    try:
        db.query(ConsultRequest).filter(ConsultRequest.id == request_id).update({"webhook_status": status})
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
    finally:
        db.close()


def _summary(r: ConsultRequest) -> dict:
    return {
        "id": r.id,
        "ref": r.ref,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "consultation_type": r.consultation_type,
        "mode": r.mode,
        "full_name": r.full_name,
        "email": r.email,
        "phone": r.phone,
        "target_countries": (r.profile or {}).get("target_countries", []),
        "status": r.status,
    }


def _detail(r: ConsultRequest) -> dict:
    d = _summary(r)
    d.update(
        preferred_window=r.preferred_window,
        timezone=r.timezone,
        profile=r.profile,
        custom=r.custom,
        consent=r.consent,
        owner_notes=r.owner_notes,
        webhook_status=r.webhook_status,
        updated_at=r.updated_at.isoformat() if r.updated_at else None,
    )
    return d


def _owner_site(db: Session, user: Any) -> FounderSite:
    site = db.query(FounderSite).filter(FounderSite.user_id == user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="You do not have a site yet.")
    return site


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------
@router.post("/submit", status_code=201)
def submit_request(
    body: SubmitIn,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    ip = _client_ip(request)

    # Honeypot: pretend it worked so bots do not adapt. Nothing is stored.
    if body.website:
        return {"ok": True, "ref": "SC-000000"}

    if _rate_limited(ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again in a few minutes.")

    if len(json.dumps({"p": body.profile, "c": body.custom}, default=str)) > MAX_BODY_CHARS:
        raise HTTPException(status_code=413, detail="Your request is too large.")

    if not body.consent.accepted:
        raise HTTPException(
            status_code=422,
            detail={"message": "Please confirm you agree before sending.", "field_errors": {"consent": "Tick the box to continue."}},
        )

    not_open = HTTPException(status_code=404, detail="This site is not accepting requests.")
    site = db.query(FounderSite).filter(FounderSite.slug == body.site_slug.strip().lower()).first()
    if not site or site.status not in ACCEPTING_STATUSES:
        raise not_open
    td = _load_template_data(db, site)
    if td is None:
        raise not_open

    profile, custom, field_errors = rules.validate_submission(
        td, body.consultation_type, body.mode, body.profile, body.custom
    )
    if field_errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "Please check the highlighted answers.", "field_errors": field_errors},
        )

    email = profile["email"].lower()

    # Same person, same session, within minutes: return the earlier reference (double click, retry).
    since = datetime.now(timezone.utc) - DUPLICATE_WINDOW
    dup = (
        db.query(ConsultRequest)
        .filter(
            ConsultRequest.founder_site_id == site.id,
            ConsultRequest.email == email,
            ConsultRequest.consultation_type == body.consultation_type,
            ConsultRequest.created_at >= since,
        )
        .first()
    )
    if dup:
        return {"ok": True, "ref": dup.ref}

    now = datetime.now(timezone.utc)
    obj = ConsultRequest(
        ref=_new_ref(db),
        founder_site_id=site.id,
        consultation_type=body.consultation_type,
        mode=body.mode,
        preferred_window=body.preferred_window.model_dump(exclude_none=True) if body.preferred_window else None,
        timezone=body.timezone,
        full_name=profile["full_name"],
        email=email,
        phone=profile.get("phone"),
        profile=profile,
        custom=custom,
        # The server sets the timestamp; the client's clock is not evidence of consent.
        consent={"accepted": True, "policy_version": body.consent.policy_version, "timestamp": now.isoformat()},
        status="new",
        source_ip_hash=_ip_hash(ip),
    )
    try:
        db.add(obj)
        db.commit()
        db.refresh(obj)
    except Exception:  # noqa: BLE001
        db.rollback()
        logger.exception("could not save consult request")
        raise HTTPException(status_code=500, detail="We could not save your request. Please try again.")

    webhook_url = ((td.get("integrations") or {}).get("webhook_url") or "").strip()
    if webhook_url:
        payload = {
            "event": "consult_request.created",
            "ref": obj.ref,
            "site_slug": site.slug,
            "consultation_type": obj.consultation_type,
            "mode": obj.mode,
            "preferred_window": obj.preferred_window,
            "timezone": obj.timezone,
            "profile": obj.profile,
            "custom": obj.custom,
            "consent": obj.consent,
            "created_at": obj.created_at.isoformat() if obj.created_at else now.isoformat(),
        }
        background.add_task(_post_webhook, obj.id, webhook_url, payload)

    return {"ok": True, "ref": obj.ref}


# ---------------------------------------------------------------------------
# Owner (login required; scoped to the caller's own site)
# ---------------------------------------------------------------------------
@router.get("/mine")
def list_my_requests(
    status: str | None = Query(default=None, max_length=32),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    site = _owner_site(db, user)
    q = db.query(ConsultRequest).filter(ConsultRequest.founder_site_id == site.id)
    if status:
        q = q.filter(ConsultRequest.status == status)
    total = q.count()
    rows = q.order_by(ConsultRequest.created_at.desc()).offset(offset).limit(limit).all()
    return {"items": [_summary(r) for r in rows], "total": total}


def _get_owned(db: Session, user: Any, req_id: int) -> ConsultRequest:
    site = _owner_site(db, user)
    r = (
        db.query(ConsultRequest)
        .filter(ConsultRequest.id == req_id, ConsultRequest.founder_site_id == site.id)
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Request not found.")
    return r


@router.get("/{req_id}")
def get_my_request(req_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return _detail(_get_owned(db, user, req_id))


@router.patch("/{req_id}")
def update_my_request(req_id: int, body: UpdateIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    r = _get_owned(db, user, req_id)
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=422, detail="Nothing to update.")
    for k, v in data.items():
        setattr(r, k, v)
    try:
        db.commit()
        db.refresh(r)
    except Exception:  # noqa: BLE001
        db.rollback()
        logger.exception("could not update consult request %s", req_id)
        raise HTTPException(status_code=500, detail="Could not save the change.")
    return _detail(r)
