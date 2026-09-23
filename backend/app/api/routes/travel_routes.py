"""Travel-host template routes.

Public (add both to PUBLIC_ROUTES in core/middleware.py — exact (method, path) entries):
  GET  /api/public-travel/{slug}             published packages + live seat counts
  POST /api/public-travel/{slug}/bookings    seat request (holds seats for N minutes)

Owner (logged-in founder):
  GET/POST        /api/my-site/travel/packages
  PUT/DELETE      /api/my-site/travel/packages/{package_id}
  GET/PUT         /api/my-site/travel/settings
  GET             /api/my-site/travel/bookings
  PATCH           /api/my-site/travel/bookings/{booking_id}

JSON uses camelCase to match frontend/lib/travel-schema.js.
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.founder_site import FounderSite
from ...models.travel import TravelBooking, TravelDeparture, TravelPackage, TravelSettings
from ...models.user import User

public_router = APIRouter(prefix="/api/public-travel", tags=["travel-public"])
owner_router = APIRouter(prefix="/api/my-site/travel", tags=["travel-owner"])

DEFAULT_SETTINGS = {
    "bookingEnabled": True,
    "depositMode": "percent",
    "depositValue": 20,
    "holdMinutes": 30,
    "balanceDueDays": 21,
    "currency": "INR",
    "gstin": "",
    "tourismRegistration": "",
    "insuranceIncluded": False,
    "cancellationPolicy": [
        {"daysBefore": 45, "refundPercent": 90},
        {"daysBefore": 30, "refundPercent": 50},
        {"daysBefore": 15, "refundPercent": 0},
    ],
    "bookingTerms": "",
}
PUBLIC_SETTING_KEYS = {
    "bookingEnabled", "depositMode", "depositValue", "holdMinutes", "balanceDueDays",
    "currency", "gstin", "tourismRegistration", "insuranceIncluded", "cancellationPolicy", "bookingTerms",
}
HOLDING = {"requested"}
BOOKED = {"deposit_paid", "confirmed"}
ALLOWED_TRANSITIONS = {
    "requested": {"deposit_paid", "confirmed", "cancelled"},
    "deposit_paid": {"confirmed", "cancelled"},
    "confirmed": {"cancelled"},
    "cancelled": set(),
}


# ─── Schemas (Pydantic v2) ───────────────────────────────────────────────────
class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class ItineraryDay(CamelModel):
    day: int = 1
    title: str = ""
    description: str = ""
    stay: str = ""
    meals: str = ""


class DepartureIn(CamelModel):
    server_id: Optional[int] = None
    start_date: Optional[date] = None
    seats_total: int = Field(16, ge=1, le=500)
    seats_booked: int = Field(0, ge=0)
    price_override: Optional[Decimal] = Field(None, ge=0)
    status: str = Field("open", pattern="^(open|closed|cancelled)$")
    booking_enabled: bool = True

    @field_validator("start_date", "price_override", mode="before")
    @classmethod
    def _blank_to_none(cls, v):
        return None if v == "" else v


class PackageIn(CamelModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: Optional[str] = None
    destination: str = ""
    region: str = Field("india", pattern="^(india|international)$")
    trip_type: str = "group"
    duration_days: int = Field(1, ge=1, le=90)
    duration_nights: int = Field(0, ge=0, le=90)
    start_city: str = ""
    price_twin: Optional[Decimal] = Field(None, ge=0)
    price_triple: Optional[Decimal] = Field(None, ge=0)
    price_single: Optional[Decimal] = Field(None, ge=0)
    deposit_override: Optional[Decimal] = Field(None, ge=0)
    difficulty: str = Field("easy", pattern="^(easy|moderate|challenging)$")
    min_age: Optional[int] = Field(None, ge=0, le=100)
    group_size_max: Optional[int] = Field(None, ge=1, le=500)
    cover_image: str = ""
    youtube_video_id: str = ""
    summary: str = ""
    highlights: List[str] = []
    itinerary: List[ItineraryDay] = []
    inclusions: List[str] = []
    exclusions: List[str] = []
    stay_type: str = ""
    transport: str = ""
    visa_support: bool = False
    status: str = Field("draft", pattern="^(draft|published|archived)$")
    booking_enabled: bool = True
    sort_order: int = 0
    departures: List[DepartureIn] = []

    @field_validator(
        "price_twin", "price_triple", "price_single", "deposit_override", "min_age", "group_size_max", mode="before"
    )
    @classmethod
    def _blank_to_none(cls, v):
        return None if v == "" else v

    @field_validator("youtube_video_id")
    @classmethod
    def _video_id(cls, v: str) -> str:
        v = (v or "").strip()
        if v and not re.fullmatch(r"[A-Za-z0-9_-]{6,20}", v):
            raise ValueError("YouTube video ID looks wrong; paste only the ID, not the full link")
        return v


class BookingRequest(CamelModel):
    package_id: int
    departure_id: int
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=6, max_length=40)
    email: Optional[str] = Field(None, max_length=255)
    travellers: int = Field(1, ge=1, le=20)
    sharing: str = Field("twin", pattern="^(twin|triple|single)$")
    notes: str = Field("", max_length=2000)


class BookingPatch(CamelModel):
    status: str = Field(..., pattern="^(requested|deposit_paid|confirmed|cancelled)$")
    payment_id: Optional[str] = None


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _now():
    return datetime.now(timezone.utc)


def _aware(value: Optional[datetime]) -> Optional[datetime]:
    """Treat naive datetimes as UTC (defensive; Postgres timestamptz is already aware)."""
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _slugify(text: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", (text or "").lower()))[:80] or "trip"


def _money(v) -> Optional[float]:
    return float(v) if v is not None else None


def _get_settings(db: Session, user_id: int) -> dict:
    row = db.query(TravelSettings).filter(TravelSettings.user_id == user_id).first()
    return {**DEFAULT_SETTINGS, **((row.settings or {}) if row else {})}


def _active_holds(db: Session, departure_ids: List[int]) -> dict:
    if not departure_ids:
        return {}
    rows = (
        db.query(TravelBooking.departure_id, func.coalesce(func.sum(TravelBooking.travellers), 0))
        .filter(
            TravelBooking.departure_id.in_(departure_ids),
            TravelBooking.status == "requested",
            TravelBooking.hold_expires_at > _now(),
        )
        .group_by(TravelBooking.departure_id)
        .all()
    )
    return {dep_id: int(total) for dep_id, total in rows}


def _online_booked(db: Session, departure_id: int) -> int:
    total = (
        db.query(func.coalesce(func.sum(TravelBooking.travellers), 0))
        .filter(TravelBooking.departure_id == departure_id, TravelBooking.status.in_(BOOKED))
        .scalar()
    )
    return int(total or 0)


def _price_for(pkg: TravelPackage, dep: TravelDeparture, sharing: str) -> Optional[Decimal]:
    if dep.price_override:
        return Decimal(dep.price_override)
    return {"twin": pkg.price_twin, "triple": pkg.price_triple, "single": pkg.price_single}.get(sharing)


def _deposit_per_person(pkg: TravelPackage, per_person: Decimal, settings: dict) -> Decimal:
    if pkg.deposit_override:
        return Decimal(pkg.deposit_override)
    value = Decimal(str(settings.get("depositValue") or 0))
    if settings.get("depositMode") == "fixed":
        return value
    return (per_person * value / Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def _serialize_departure(dep: TravelDeparture, held: int) -> dict:
    return {
        "id": str(dep.id),
        "serverId": dep.id,
        "startDate": dep.start_date.isoformat(),
        "seatsTotal": dep.seats_total,
        "seatsBooked": dep.seats_booked,
        "seatsHeld": held,
        "priceOverride": _money(dep.price_override),
        "status": dep.status,
        "bookingEnabled": dep.booking_enabled,
    }


def _serialize_package(pkg: TravelPackage, holds: dict, *, public: bool = False) -> dict:
    deps = pkg.departures
    if public:
        today = date.today()
        deps = [d for d in deps if d.status != "cancelled" and d.start_date > today]
    return {
        "id": str(pkg.id),
        "serverId": pkg.id,
        "slug": pkg.slug,
        "title": pkg.title,
        "destination": pkg.destination or "",
        "region": pkg.region,
        "tripType": pkg.trip_type,
        "durationDays": pkg.duration_days,
        "durationNights": pkg.duration_nights,
        "startCity": pkg.start_city or "",
        "priceTwin": _money(pkg.price_twin),
        "priceTriple": _money(pkg.price_triple),
        "priceSingle": _money(pkg.price_single),
        "depositOverride": _money(pkg.deposit_override),
        "difficulty": pkg.difficulty,
        "minAge": pkg.min_age,
        "groupSizeMax": pkg.group_size_max,
        "coverImage": pkg.cover_image or "",
        "youtubeVideoId": pkg.youtube_video_id or "",
        "summary": pkg.summary or "",
        "highlights": pkg.highlights or [],
        "itinerary": pkg.itinerary or [],
        "inclusions": pkg.inclusions or [],
        "exclusions": pkg.exclusions or [],
        "stayType": pkg.stay_type or "",
        "transport": pkg.transport or "",
        "visaSupport": pkg.visa_support,
        "status": pkg.status,
        "bookingEnabled": pkg.booking_enabled,
        "sortOrder": pkg.sort_order,
        "departures": [_serialize_departure(d, holds.get(d.id, 0)) for d in deps],
    }


def _serialize_booking(b: TravelBooking) -> dict:
    return {
        "id": b.id,
        "packageId": str(b.package_id),
        "packageTitle": b.package.title if b.package else "",
        "departureId": str(b.departure_id),
        "startDate": b.departure.start_date.isoformat() if b.departure else None,
        "name": b.name,
        "phone": b.phone,
        "email": b.email,
        "travellers": b.travellers,
        "sharing": b.sharing,
        "notes": b.notes or "",
        "perPersonPrice": _money(b.per_person_price),
        "totalAmount": _money(b.total_amount),
        "depositAmount": _money(b.deposit_amount),
        "status": b.status,
        "holdExpiresAt": b.hold_expires_at.isoformat() if b.hold_expires_at else None,
        "paymentId": b.payment_id,
        "createdAt": b.created_at.isoformat() if b.created_at else None,
    }


def _publish_errors(data: PackageIn) -> List[str]:
    errs = []
    if not data.destination.strip():
        errs.append("destination is required")
    if not (data.price_twin and data.price_twin > 0):
        errs.append("twin-sharing price is required")
    if not any(d.title.strip() for d in data.itinerary):
        errs.append("add at least one itinerary day")
    return errs


def _unique_slug(db: Session, user_id: int, wanted: str, exclude_id: Optional[int] = None) -> str:
    base = _slugify(wanted)
    slug, n = base, 2
    while True:
        q = db.query(TravelPackage.id).filter(TravelPackage.user_id == user_id, TravelPackage.slug == slug)
        if exclude_id:
            q = q.filter(TravelPackage.id != exclude_id)
        if not q.first():
            return slug
        slug, n = f"{base}-{n}", n + 1


def _owned_package(db: Session, user: User, package_id: int) -> TravelPackage:
    pkg = (
        db.query(TravelPackage)
        .options(selectinload(TravelPackage.departures))
        .filter(TravelPackage.id == package_id, TravelPackage.user_id == user.id)
        .first()
    )
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg


def _apply_package(db: Session, pkg: TravelPackage, data: PackageIn, user: User) -> None:
    if data.status == "published":
        errs = _publish_errors(data)
        if errs:
            raise HTTPException(status_code=422, detail="Cannot publish: " + "; ".join(errs))

    pkg.title = data.title.strip()
    pkg.slug = _unique_slug(db, user.id, data.slug or data.title, exclude_id=pkg.id)
    for field in (
        "destination", "region", "trip_type", "duration_days", "duration_nights", "start_city",
        "price_twin", "price_triple", "price_single", "deposit_override", "difficulty", "min_age",
        "group_size_max", "cover_image", "youtube_video_id", "summary", "stay_type", "transport",
        "visa_support", "status", "booking_enabled", "sort_order",
    ):
        setattr(pkg, field, getattr(data, field))
    pkg.highlights = [h.strip() for h in data.highlights if h.strip()]
    pkg.inclusions = [h.strip() for h in data.inclusions if h.strip()]
    pkg.exclusions = [h.strip() for h in data.exclusions if h.strip()]
    pkg.itinerary = [
        {**d.model_dump(), "day": i + 1} for i, d in enumerate(x for x in data.itinerary if x.title.strip() or x.description.strip())
    ]

    site = db.query(FounderSite).filter(FounderSite.user_id == user.id).first()
    if site:
        pkg.founder_site_id = site.id

    # Upsert departures. Never delete a departure that has bookings — cancel it instead.
    existing = {d.id: d for d in pkg.departures}
    keep_ids = set()
    for d in data.departures:
        if not d.start_date:
            continue  # blank row left in the editor
        dep = existing.get(d.server_id) if d.server_id else None
        if dep is None:
            dep = TravelDeparture(package=pkg)
            db.add(dep)
        online = _online_booked(db, dep.id) if dep.id else 0
        if d.seats_total < online:
            raise HTTPException(
                status_code=422,
                detail=f"{d.start_date}: {online} seats are already sold online; total seats can't be lower.",
            )
        dep.start_date = d.start_date
        dep.seats_total = d.seats_total
        dep.seats_booked = max(d.seats_booked, online)  # offline sales can be added, online sales can't be erased
        dep.price_override = d.price_override
        dep.status = d.status
        dep.booking_enabled = d.booking_enabled
        if dep.id:
            keep_ids.add(dep.id)

    for dep_id, dep in existing.items():
        if dep_id in keep_ids:
            continue
        has_bookings = db.query(TravelBooking.id).filter(TravelBooking.departure_id == dep_id).first()
        if has_bookings:
            dep.status = "cancelled"
        else:
            pkg.departures.remove(dep)


def _site_by_slug(db: Session, slug: str) -> FounderSite:
    site = db.query(FounderSite).filter(FounderSite.slug == slug).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


# ─── Public routes ───────────────────────────────────────────────────────────
@public_router.get("/{slug}")
def get_public_travel(slug: str, db: Session = Depends(get_db)):
    site = _site_by_slug(db, slug)
    packages = (
        db.query(TravelPackage)
        .options(selectinload(TravelPackage.departures))
        .filter(TravelPackage.user_id == site.user_id, TravelPackage.status == "published")
        .order_by(TravelPackage.sort_order, TravelPackage.id)
        .all()
    )
    holds = _active_holds(db, [d.id for p in packages for d in p.departures])
    settings = _get_settings(db, site.user_id)
    return {
        "settings": {k: v for k, v in settings.items() if k in PUBLIC_SETTING_KEYS},
        "packages": [_serialize_package(p, holds, public=True) for p in packages],
    }


@public_router.post("/{slug}/bookings", status_code=status.HTTP_201_CREATED)
def request_booking(slug: str, body: BookingRequest, db: Session = Depends(get_db)):
    site = _site_by_slug(db, slug)
    settings = _get_settings(db, site.user_id)

    # Lock the departure row so two travellers can't take the last seat at the same time.
    dep = (
        db.query(TravelDeparture)
        .join(TravelPackage, TravelPackage.id == TravelDeparture.package_id)
        .filter(
            TravelDeparture.id == body.departure_id,
            TravelDeparture.package_id == body.package_id,
            TravelPackage.user_id == site.user_id,
        )
        .with_for_update(of=TravelDeparture)
        .first()
    )
    if not dep:
        raise HTTPException(status_code=404, detail="This departure is no longer available.")
    pkg = dep.package

    if not (settings.get("bookingEnabled") and pkg.status == "published" and pkg.booking_enabled
            and dep.status == "open" and dep.booking_enabled and dep.start_date > date.today()):
        raise HTTPException(status_code=409, detail="Online booking is closed for this departure. Send an enquiry instead.")

    held = _active_holds(db, [dep.id]).get(dep.id, 0)
    left = dep.seats_total - dep.seats_booked - held
    if left < body.travellers:
        raise HTTPException(status_code=409, detail=f"Only {max(left, 0)} seat(s) left on this date.")

    per_person = _price_for(pkg, dep, body.sharing)
    if not per_person:
        raise HTTPException(status_code=422, detail="This room type isn't offered on this trip.")
    deposit_pp = _deposit_per_person(pkg, Decimal(per_person), settings)

    booking = TravelBooking(
        owner_user_id=site.user_id,
        package_id=pkg.id,
        departure_id=dep.id,
        name=body.name.strip(),
        phone=body.phone.strip(),
        email=(body.email or "").strip() or None,
        travellers=body.travellers,
        sharing=body.sharing,
        notes=body.notes.strip(),
        per_person_price=per_person,
        total_amount=Decimal(per_person) * body.travellers,
        deposit_amount=deposit_pp * body.travellers,
        status="requested",
        hold_expires_at=_now() + timedelta(minutes=int(settings.get("holdMinutes") or 30)),
    )
    db.add(booking)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save the booking. Please try again.")
    db.refresh(booking)

    # Payment hook: create a Razorpay order for booking.deposit_amount with the same helper
    # payment_routes.create_order uses, and return it here as "payment". The Razorpay webhook
    # should then PATCH the booking to deposit_paid (see README_TRAVEL.md).
    return {"booking": _serialize_booking(booking), "payment": None}


# ─── Owner routes ────────────────────────────────────────────────────────────
@owner_router.get("/packages")
def list_packages(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    packages = (
        db.query(TravelPackage)
        .options(selectinload(TravelPackage.departures))
        .filter(TravelPackage.user_id == user.id)
        .order_by(TravelPackage.sort_order, TravelPackage.id)
        .all()
    )
    holds = _active_holds(db, [d.id for p in packages for d in p.departures])
    return [_serialize_package(p, holds) for p in packages]


@owner_router.post("/packages", status_code=status.HTTP_201_CREATED)
def create_package(body: PackageIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pkg = TravelPackage(user_id=user.id, title=body.title, slug=_unique_slug(db, user.id, body.slug or body.title))
    db.add(pkg)
    db.flush()  # get pkg.id before departures are attached
    _apply_package(db, pkg, body, user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save the package.")
    db.refresh(pkg)
    return _serialize_package(pkg, _active_holds(db, [d.id for d in pkg.departures]))


@owner_router.put("/packages/{package_id}")
def update_package(package_id: int, body: PackageIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pkg = _owned_package(db, user, package_id)
    _apply_package(db, pkg, body, user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save the package.")
    db.refresh(pkg)
    return _serialize_package(pkg, _active_holds(db, [d.id for d in pkg.departures]))


@owner_router.delete("/packages/{package_id}")
def delete_package(package_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pkg = _owned_package(db, user, package_id)
    has_bookings = db.query(TravelBooking.id).filter(TravelBooking.package_id == pkg.id).first()
    if has_bookings:
        pkg.status = "archived"  # keep history for bookings, refunds and GST records
        db.commit()
        return {"archived": True}
    db.delete(pkg)
    db.commit()
    return {"deleted": True}


@owner_router.get("/settings")
def get_settings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _get_settings(db, user.id)


@owner_router.put("/settings")
def save_settings(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    clean = {k: v for k, v in body.items() if k in DEFAULT_SETTINGS}
    if "depositValue" in clean and (not isinstance(clean["depositValue"], (int, float)) or clean["depositValue"] < 0):
        raise HTTPException(status_code=422, detail="Deposit must be a positive number.")
    if clean.get("depositMode") == "percent" and clean.get("depositValue", 0) > 100:
        raise HTTPException(status_code=422, detail="Deposit percentage can't be more than 100.")
    row = db.query(TravelSettings).filter(TravelSettings.user_id == user.id).first()
    if not row:
        row = TravelSettings(user_id=user.id, settings={})
        db.add(row)
    row.settings = {**DEFAULT_SETTINGS, **(row.settings or {}), **clean}
    db.commit()
    return row.settings


@owner_router.get("/bookings")
def list_bookings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(TravelBooking)
        .options(selectinload(TravelBooking.package), selectinload(TravelBooking.departure))
        .filter(TravelBooking.owner_user_id == user.id)
        .order_by(TravelBooking.created_at.desc())
        .limit(500)
        .all()
    )
    return [_serialize_booking(b) for b in rows]


@owner_router.patch("/bookings/{booking_id}")
def update_booking(booking_id: int, body: BookingPatch, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    b = db.query(TravelBooking).filter(TravelBooking.id == booking_id, TravelBooking.owner_user_id == user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    src, dst = b.status, body.status
    if src != dst and dst not in ALLOWED_TRANSITIONS[src]:
        raise HTTPException(status_code=409, detail=f"Can't change a {src} booking to {dst}.")

    dep = db.query(TravelDeparture).filter(TravelDeparture.id == b.departure_id).with_for_update().first()
    if src in HOLDING and dst in BOOKED:
        others_held = _active_holds(db, [dep.id]).get(dep.id, 0)
        if b.hold_expires_at and _aware(b.hold_expires_at) > _now():
            others_held -= b.travellers
        if dep.seats_total - dep.seats_booked - max(others_held, 0) < b.travellers:
            raise HTTPException(status_code=409, detail="Not enough seats left to confirm this booking. Increase seats first.")
        dep.seats_booked += b.travellers
    elif src in BOOKED and dst == "cancelled":
        dep.seats_booked = max(0, dep.seats_booked - b.travellers)

    b.status = dst
    b.hold_expires_at = None if dst != "requested" else b.hold_expires_at
    if body.payment_id:
        b.payment_id = body.payment_id
    db.commit()
    db.refresh(b)
    return _serialize_booking(b)