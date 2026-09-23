"""
Trip Architect — API routes
Sibling to app/api/routes/travel_routes.py — do not edit that file.

Public:
  POST /api/trip-architect/requests            submit a trip brief
  GET  /api/trip-architect/share/{token}        read-only itinerary view

Owner (requires login; scoped to the caller's own founder_site):
  GET   /api/trip-architect/requests                     list/filter the pipeline
  GET   /api/trip-architect/requests/{id}                one request, with options + itinerary
  PATCH /api/trip-architect/requests/{id}                update status/fields
  POST  /api/trip-architect/requests/{id}/options         add a compared option
  PATCH /api/trip-architect/requests/{id}/options/{oid}   update an option
  DELETE /api/trip-architect/requests/{id}/options/{oid}  remove an option
  PUT   /api/trip-architect/requests/{id}/itinerary        replace the full day-by-day plan
  POST  /api/trip-architect/requests/{id}/share-link       (re)generate the traveller share link

Registration checklist (not done by this file — three separate edits):
  1. main.py:            app.include_router(trip_architect_routes.router)
  2. core/middleware.py:  add ("POST", "/api/trip-architect/requests") and
                           ("GET", "/api/trip-architect/share/{token}") to
                           PUBLIC_ROUTES, with the same per-IP rate limit
                           already applied to /api/genie/* and /api/chat
  3. alembic/env.py:      import app.models.trip_request (already needed
                           for the migration, so likely already done)
"""

import re
import secrets
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.founder_site import FounderSite
from ...models.trip_request import (
    TripItineraryDay, TripOption, TripOptionCategory, TripRequest, TripRequestStatus,
)
from ...models.user import User

router = APIRouter(prefix="/api/trip-architect", tags=["trip-architect"])

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# NOTE: Safety Rule #6 in AGENTS.md calls for gating new routes behind a
# 'sites_enabled' setting. Checked the live site_settings table on 2026-09-23
# and that key does not exist — travel-host runs without it, so it is not
# how gating actually works in this codebase. Removed the speculative gate
# rather than inventing a row to satisfy a guess. If real per-template
# enable/disable is wanted later, confirm the actual mechanism travel_routes.py
# or site_build_routes.py uses (if any) and match that instead.


# ─── Schemas ────────────────────────────────────────────────────────────────────

class TripBriefIn(BaseModel):
    model_config = ConfigDict(extra="allow")  # tolerate extra fields the form may send (e.g. `source`, `business`)

    site_slug: str
    name: str
    email: str
    phone: Optional[str] = None
    destinations: Optional[str] = None
    date_mode: str = "fixed"
    start_date: Optional[str] = None  # ISO date if fixed, free text if flexible
    end_date: Optional[str] = None
    traveller_count: Optional[int] = None
    pace: Optional[str] = None
    budget: Optional[str] = None
    message: Optional[str] = None

    # Honeypot — a real visitor never fills this in; a bot form-filler usually does.
    website: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _valid_email(cls, v):
        if not EMAIL_RE.match(v or ""):
            raise ValueError("Enter a valid email.")
        return v

    @field_validator("name")
    @classmethod
    def _non_empty_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Enter your name.")
        return v.strip()


class TripRequestUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Optional[str] = None
    traveller_name: Optional[str] = None
    phone: Optional[str] = None
    destinations: Optional[List[str]] = None
    pace: Optional[str] = None
    dietary_needs: Optional[str] = None
    accessibility_needs: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    message: Optional[str] = None

    @field_validator("status")
    @classmethod
    def _valid_status(cls, v):
        if v is not None and v not in TripRequestStatus.ALL:
            raise ValueError(f"status must be one of {TripRequestStatus.ALL}")
        return v


class TripOptionIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: str
    title: str
    provider_contact: Optional[str] = None
    price: Optional[float] = None
    currency: str = "INR"
    inclusions: Optional[List[str]] = None
    cancellation_terms: Optional[str] = None
    is_recommended: bool = False
    sort_order: int = 0

    @field_validator("category")
    @classmethod
    def _valid_category(cls, v):
        if v not in TripOptionCategory.ALL:
            raise ValueError(f"category must be one of {TripOptionCategory.ALL}")
        return v


class TripOptionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = None
    provider_contact: Optional[str] = None
    price: Optional[float] = None
    inclusions: Optional[List[str]] = None
    cancellation_terms: Optional[str] = None
    is_recommended: Optional[bool] = None
    sort_order: Optional[int] = None


class ItineraryDayIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    day_number: int
    title: Optional[str] = None
    sightseeing_order: Optional[List[str]] = None
    travel_time_notes: Optional[str] = None
    rest_time_notes: Optional[str] = None
    entry_fees: Optional[str] = None
    meal_suggestions: Optional[str] = None
    estimated_food_spend: Optional[float] = None
    local_transport_notes: Optional[str] = None
    contingency_notes: Optional[str] = None


class ItineraryIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    days: List[ItineraryDayIn]


# ─── Helpers ────────────────────────────────────────────────────────────────────

def _parse_destinations(raw: Optional[str]) -> list:
    if not raw:
        return []
    return [d.strip() for d in raw.split(",") if d.strip()]


def _parse_date(raw: Optional[str]):
    if not raw:
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError:
        return None


def _parse_budget(raw: Optional[str]):
    """Best-effort parse of a free-text budget string into (min, max).
    Falls back to (None, None) rather than raising — the raw text is
    preserved separately in `message` so nothing is lost either way."""
    if not raw:
        return None, None
    numbers = re.findall(r"[\d,]+", raw)
    numbers = [float(n.replace(",", "")) for n in numbers if n.replace(",", "").isdigit()]
    if len(numbers) >= 2:
        return min(numbers[:2]), max(numbers[:2])
    if len(numbers) == 1:
        return None, numbers[0]
    return None, None


def _get_owner_site(db: Session, current_user: User) -> FounderSite:
    site = db.query(FounderSite).filter(FounderSite.user_id == current_user.id).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No site found for this account.")
    return site


def _get_owned_request(db: Session, current_user: User, request_id: int) -> TripRequest:
    site = _get_owner_site(db, current_user)
    trip_request = (
        db.query(TripRequest)
        .filter(TripRequest.id == request_id, TripRequest.founder_site_id == site.id)
        .first()
    )
    if not trip_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip request not found.")
    return trip_request


# ─── Public: submit a trip brief ───────────────────────────────────────────────

@router.post("/requests", status_code=status.HTTP_201_CREATED)
def submit_trip_request(payload: TripBriefIn, db: Session = Depends(get_db)):
    # Honeypot tripped — pretend success, save nothing.
    if payload.website:
        return {"success": True, "id": None}

    site = db.query(FounderSite).filter(FounderSite.slug == payload.site_slug).first()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")

    budget_min, budget_max = _parse_budget(payload.budget)
    message_parts = []
    if payload.budget:
        message_parts.append(f"Budget (as entered): {payload.budget}")
    if payload.message:
        message_parts.append(payload.message)

    trip_request = TripRequest(
        founder_site_id=site.id,
        traveller_name=payload.name,
        email=payload.email,
        phone=payload.phone,
        destinations=_parse_destinations(payload.destinations),
        date_mode=payload.date_mode if payload.date_mode in ("fixed", "flexible") else "fixed",
        start_date=_parse_date(payload.start_date) if payload.date_mode == "fixed" else None,
        end_date=_parse_date(payload.end_date) if payload.date_mode == "fixed" else None,
        flex_window_notes=payload.start_date if payload.date_mode == "flexible" else None,
        traveller_count=payload.traveller_count,
        pace=payload.pace,
        budget_min=budget_min,
        budget_max=budget_max,
        currency="INR",
        message="\n\n".join(message_parts) or None,
        status=TripRequestStatus.NEW,
    )
    db.add(trip_request)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save your brief — please try again.")
    db.refresh(trip_request)
    return {"success": True, "id": trip_request.id}


# ─── Owner: pipeline ────────────────────────────────────────────────────────────

@router.get("/requests")
def list_trip_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = _get_owner_site(db, current_user)
    q = db.query(TripRequest).filter(TripRequest.founder_site_id == site.id)
    if status_filter:
        if status_filter not in TripRequestStatus.ALL:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"status must be one of {TripRequestStatus.ALL}")
        q = q.filter(TripRequest.status == status_filter)

    total = q.count()
    items = (
        q.order_by(TripRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [r.to_dict() for r in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/requests/{request_id}")
def get_trip_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip_request = _get_owned_request(db, current_user, request_id)
    return trip_request.to_dict(include_relations=True)


@router.patch("/requests/{request_id}")
def update_trip_request(
    request_id: int, payload: TripRequestUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    trip_request = _get_owned_request(db, current_user, request_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(trip_request, field, value)
    trip_request.updated_at = datetime.utcnow()
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save changes.")
    db.refresh(trip_request)
    return trip_request.to_dict(include_relations=True)


# ─── Owner: compared options ───────────────────────────────────────────────────

@router.post("/requests/{request_id}/options", status_code=status.HTTP_201_CREATED)
def add_trip_option(
    request_id: int, payload: TripOptionIn,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    trip_request = _get_owned_request(db, current_user, request_id)
    option = TripOption(trip_request_id=trip_request.id, **payload.model_dump())
    db.add(option)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save that option.")
    db.refresh(option)
    return option.to_dict()


@router.patch("/requests/{request_id}/options/{option_id}")
def update_trip_option(
    request_id: int, option_id: int, payload: TripOptionUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    trip_request = _get_owned_request(db, current_user, request_id)
    option = next((o for o in trip_request.options if o.id == option_id), None)
    if not option:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Option not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(option, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save changes.")
    db.refresh(option)
    return option.to_dict()


@router.delete("/requests/{request_id}/options/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_option(
    request_id: int, option_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    trip_request = _get_owned_request(db, current_user, request_id)
    option = next((o for o in trip_request.options if o.id == option_id), None)
    if not option:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Option not found.")
    db.delete(option)
    db.commit()
    return None


# ─── Owner: itinerary builder ──────────────────────────────────────────────────

@router.put("/requests/{request_id}/itinerary")
def save_trip_itinerary(
    request_id: int, payload: ItineraryIn,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    trip_request = _get_owned_request(db, current_user, request_id)

    day_numbers = [d.day_number for d in payload.days]
    if len(day_numbers) != len(set(day_numbers)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="day_number values must be unique within the itinerary.")

    # Replace wholesale — simpler and safer than diffing, and this table has
    # no independent identity travellers reference directly.
    for existing in list(trip_request.itinerary_days):
        db.delete(existing)
    db.flush()

    for day in payload.days:
        db.add(TripItineraryDay(trip_request_id=trip_request.id, **day.model_dump()))

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save the itinerary.")
    db.refresh(trip_request)
    return trip_request.to_dict(include_relations=True)


@router.post("/requests/{request_id}/share-link")
def create_share_link(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip_request = _get_owned_request(db, current_user, request_id)
    if not trip_request.share_token:
        trip_request.share_token = secrets.token_urlsafe(24)
        trip_request.share_token_created_at = datetime.utcnow()
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create the share link.")
        db.refresh(trip_request)
    return {"share_token": trip_request.share_token, "share_url": f"/api/trip-architect/share/{trip_request.share_token}"}


# ─── Public: shared itinerary view ─────────────────────────────────────────────

@router.get("/share/{token}")
def get_shared_itinerary(token: str, db: Session = Depends(get_db)):
    trip_request = db.query(TripRequest).filter(TripRequest.share_token == token).first()
    if not trip_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary not found.")

    # Traveller-facing view — no email/phone/budget, matching the
    # public_site_routes precedent of returning published data only.
    return {
        "traveller_name": trip_request.traveller_name,
        "destinations": trip_request.destinations or [],
        "date_mode": trip_request.date_mode,
        "start_date": trip_request.start_date.isoformat() if trip_request.start_date else None,
        "end_date": trip_request.end_date.isoformat() if trip_request.end_date else None,
        "status": trip_request.status,
        "days": [d.to_dict() for d in trip_request.itinerary_days],
        "options": [o.to_dict() for o in trip_request.options],
    }