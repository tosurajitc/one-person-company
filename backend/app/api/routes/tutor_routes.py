"""Tutor-training template routes.

Public (add all three to PUBLIC_ROUTES in core/middleware.py — exact (method, path) entries):
  GET  /api/public-tutor/{slug}                published subjects + videos + public settings
  GET  /api/public-tutor/{slug}/availability    open class slots for the next N days
  POST /api/public-tutor/{slug}/bookings        class request (holds the slot for N minutes)

Owner (logged-in founder):
  GET/POST     /api/my-site/tutor/subjects
  PUT/DELETE   /api/my-site/tutor/subjects/{subject_id}
  GET/POST     /api/my-site/tutor/videos
  DELETE       /api/my-site/tutor/videos/{video_id}
  GET/PUT      /api/my-site/tutor/availability      (PUT replaces the whole weekly template)
  GET/PUT      /api/my-site/tutor/settings
  GET          /api/my-site/tutor/bookings
  PATCH        /api/my-site/tutor/bookings/{booking_id}

JSON uses camelCase to match frontend/lib/tutor-schema.js.

Timezone: MVP assumption — one teacher, one timezone (settings.timezone). Available-slot
math is done in that zone; the frontend never needs to convert.
"""
from datetime import date, datetime, time, timedelta, timezone as dt_timezone
from decimal import Decimal
import re
from typing import List, Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.dependencies import get_current_user
from ...models.founder_site import FounderSite
from ...models.tutor import TutorAvailability, TutorBooking, TutorSettings, TutorSubject, TutorVideo
from ...models.user import User

public_router = APIRouter(prefix="/api/public-tutor", tags=["tutor-public"])
owner_router = APIRouter(prefix="/api/my-site/tutor", tags=["tutor-owner"])

DEFAULT_SETTINGS = {
    "meetPlatform": "google_meet",         # google_meet | zoom | other
    "defaultMeetLink": "",
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "bookingEnabled": True,
    "holdMinutes": 20,
    "bufferMinutes": 10,
    "advanceBookingDays": 21,
    "minNoticeHours": 6,
    "responseTimePromise": "Within a few hours",
    "cancellationPolicy": "Free to reschedule up to 12 hours before class. Trial classes cannot be rescheduled more than once.",
}
PUBLIC_SETTING_KEYS = {
    "meetPlatform", "timezone", "currency", "bookingEnabled", "advanceBookingDays",
    "minNoticeHours", "responseTimePromise", "cancellationPolicy",
}
ACTIVE_HOLD_OR_BOOKED = {"requested", "confirmed"}
ALLOWED_TRANSITIONS = {
    "requested": {"confirmed", "cancelled"},
    "confirmed": {"completed", "cancelled", "no_show"},
    "completed": set(),
    "cancelled": set(),
    "no_show": set(),
}
CATEGORIES = {"academic", "music", "art_design", "dance", "languages", "coding_tech", "test_prep", "fitness_wellness", "other"}
FORMATS = {"one_on_one", "small_group", "workshop"}
LEVELS = {"beginner", "intermediate", "advanced", "all_levels"}


# ─── Schemas (Pydantic v2) ───────────────────────────────────────────────────
class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class SubjectIn(CamelModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: Optional[str] = None
    category: str = Field("academic")
    format: str = Field("one_on_one")
    level: str = Field("all_levels")
    age_groups: List[str] = []
    duration_minutes: int = Field(60, ge=15, le=240)
    group_size_max: Optional[int] = Field(None, ge=2, le=100)
    price: Optional[Decimal] = Field(None, ge=0)
    trial_available: bool = True
    trial_price: Optional[Decimal] = Field(None, ge=0)
    package_classes: Optional[int] = Field(None, ge=2, le=100)
    package_price: Optional[Decimal] = Field(None, ge=0)
    cover_image: str = ""
    summary: str = ""
    syllabus: List[str] = []
    prerequisites: str = ""
    status: str = Field("draft", pattern="^(draft|published|archived)$")
    sort_order: int = 0

    @field_validator("price", "trial_price", "package_price", "group_size_max", "package_classes", mode="before")
    @classmethod
    def _blank_to_none(cls, v):
        return None if v == "" else v

    @field_validator("category")
    @classmethod
    def _category(cls, v):
        if v not in CATEGORIES:
            raise ValueError(f"category must be one of {sorted(CATEGORIES)}")
        return v

    @field_validator("format")
    @classmethod
    def _format(cls, v):
        if v not in FORMATS:
            raise ValueError(f"format must be one of {sorted(FORMATS)}")
        return v

    @field_validator("level")
    @classmethod
    def _level(cls, v):
        if v not in LEVELS:
            raise ValueError(f"level must be one of {sorted(LEVELS)}")
        return v


class VideoIn(CamelModel):
    subject_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=200)
    youtube_video_id: str
    description: str = ""
    sort_order: int = 0

    @field_validator("youtube_video_id")
    @classmethod
    def _video_id(cls, v: str) -> str:
        v = (v or "").strip()
        if not re.fullmatch(r"[A-Za-z0-9_-]{6,20}", v):
            raise ValueError("YouTube video ID looks wrong; paste only the ID, not the full link")
        return v


class AvailabilityWindowIn(CamelModel):
    weekday: int = Field(..., ge=0, le=6)   # 0 = Monday
    start_time: time
    end_time: time
    is_active: bool = True

    @field_validator("end_time")
    @classmethod
    def _end_after_start(cls, v, info):
        start = info.data.get("start_time")
        if start is not None and v <= start:
            raise ValueError("end_time must be after start_time")
        return v


class AvailabilityReplace(CamelModel):
    windows: List[AvailabilityWindowIn] = []


class BookingRequest(CamelModel):
    subject_id: int
    class_date: date
    start_time: time
    is_trial: bool = False
    student_name: str = Field(..., min_length=1, max_length=200, alias="studentName")
    phone: str = Field(..., min_length=6, max_length=40)
    email: Optional[str] = Field(None, max_length=255)
    notes: str = Field("", max_length=2000)

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class BookingPatch(CamelModel):
    status: str = Field(..., pattern="^(requested|confirmed|completed|cancelled|no_show)$")
    meet_link: Optional[str] = None


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _slugify(text: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", (text or "").lower()))[:80] or "class"


def _money(v) -> Optional[float]:
    return float(v) if v is not None else None


def _get_settings(db: Session, user_id: int) -> dict:
    row = db.query(TutorSettings).filter(TutorSettings.user_id == user_id).first()
    return {**DEFAULT_SETTINGS, **((row.settings or {}) if row else {})}


def _now_in(tz_name: str) -> datetime:
    try:
        return datetime.now(ZoneInfo(tz_name))
    except Exception:
        return datetime.now(dt_timezone.utc)


def _ranges_overlap(a_start: time, a_end: time, b_start: time, b_end: time) -> bool:
    return a_start < b_end and b_start < a_end


def _add_minutes(t: time, minutes: int) -> time:
    dt = datetime.combine(date.today(), t) + timedelta(minutes=minutes)
    return dt.time()


def _occupied_ranges(db: Session, user_id: int, day: date, buffer_minutes: int) -> List[tuple]:
    """Booked or actively-held (date, start, end) windows for a teacher, expanded by buffer."""
    rows = (
        db.query(TutorBooking.start_time, TutorBooking.end_time, TutorBooking.status, TutorBooking.hold_expires_at)
        .filter(TutorBooking.owner_user_id == user_id, TutorBooking.class_date == day)
        .all()
    )
    now = datetime.now(dt_timezone.utc)
    ranges = []
    for start_time, end_time, status_, hold_expires_at in rows:
        if status_ == "confirmed":
            active = True
        elif status_ == "requested":
            active = hold_expires_at is not None and hold_expires_at.replace(tzinfo=hold_expires_at.tzinfo or dt_timezone.utc) > now
        else:
            active = False
        if not active:
            continue
        ranges.append((
            _add_minutes(start_time, -buffer_minutes),
            _add_minutes(end_time, buffer_minutes),
        ))
    return ranges


def _generate_slots(db: Session, user_id: int, settings: dict, day: date, duration_minutes: int) -> List[dict]:
    weekday = day.weekday()
    windows = (
        db.query(TutorAvailability)
        .filter(TutorAvailability.user_id == user_id, TutorAvailability.weekday == weekday, TutorAvailability.is_active.is_(True))
        .all()
    )
    if not windows:
        return []

    occupied = _occupied_ranges(db, user_id, day, int(settings.get("bufferMinutes") or 0))
    tz_name = settings.get("timezone") or "Asia/Kolkata"
    now_local = _now_in(tz_name)
    is_today = day == now_local.date()
    earliest_local_time = None
    if is_today:
        earliest_local_time = _add_minutes(now_local.time(), int(settings.get("minNoticeHours") or 0) * 60)

    slots = []
    for window in windows:
        cursor = window.start_time
        while True:
            slot_end = _add_minutes(cursor, duration_minutes)
            if slot_end > window.end_time:
                break
            blocked = any(_ranges_overlap(cursor, slot_end, o_start, o_end) for o_start, o_end in occupied)
            too_soon = is_today and earliest_local_time is not None and cursor < earliest_local_time
            if not blocked and not too_soon:
                slots.append({"startTime": cursor.strftime("%H:%M"), "endTime": slot_end.strftime("%H:%M")})
            cursor = slot_end
    slots.sort(key=lambda s: s["startTime"])
    return slots


def _serialize_subject(s: TutorSubject) -> dict:
    return {
        "id": str(s.id), "serverId": s.id, "slug": s.slug, "title": s.title,
        "category": s.category, "format": s.format, "level": s.level, "ageGroups": s.age_groups or [],
        "durationMinutes": s.duration_minutes, "groupSizeMax": s.group_size_max,
        "price": _money(s.price), "trialAvailable": s.trial_available, "trialPrice": _money(s.trial_price),
        "packageClasses": s.package_classes, "packagePrice": _money(s.package_price),
        "coverImage": s.cover_image or "", "summary": s.summary or "",
        "syllabus": s.syllabus or [], "prerequisites": s.prerequisites or "",
        "status": s.status, "sortOrder": s.sort_order,
    }


def _serialize_video(v: TutorVideo) -> dict:
    return {
        "id": str(v.id), "serverId": v.id, "subjectId": str(v.subject_id) if v.subject_id else None,
        "title": v.title, "youtubeVideoId": v.youtube_video_id, "description": v.description or "",
        "sortOrder": v.sort_order,
    }


def _serialize_window(w: TutorAvailability) -> dict:
    return {
        "id": w.id, "weekday": w.weekday,
        "startTime": w.start_time.strftime("%H:%M"), "endTime": w.end_time.strftime("%H:%M"),
        "isActive": w.is_active,
    }


def _serialize_booking(b: TutorBooking) -> dict:
    return {
        "id": b.id, "subjectId": str(b.subject_id), "subjectTitle": b.subject.title if b.subject else "",
        "studentName": b.student_name, "phone": b.phone, "email": b.email, "notes": b.notes or "",
        "classDate": b.class_date.isoformat(), "startTime": b.start_time.strftime("%H:%M"),
        "endTime": b.end_time.strftime("%H:%M"), "isTrial": b.is_trial, "price": _money(b.price),
        "status": b.status, "meetLink": b.meet_link, "paymentId": b.payment_id,
        "holdExpiresAt": b.hold_expires_at.isoformat() if b.hold_expires_at else None,
        "createdAt": b.created_at.isoformat() if b.created_at else None,
    }


def _publish_errors(data: SubjectIn) -> List[str]:
    errs = []
    if not data.summary.strip():
        errs.append("a short description is required")
    if data.price is None and not data.trial_available:
        errs.append("set a price, or enable a trial class")
    return errs


def _unique_slug(db: Session, user_id: int, wanted: str, exclude_id: Optional[int] = None) -> str:
    base = _slugify(wanted)
    slug, n = base, 2
    while True:
        q = db.query(TutorSubject.id).filter(TutorSubject.user_id == user_id, TutorSubject.slug == slug)
        if exclude_id:
            q = q.filter(TutorSubject.id != exclude_id)
        if not q.first():
            return slug
        slug, n = f"{base}-{n}", n + 1


def _owned_subject(db: Session, user: User, subject_id: int) -> TutorSubject:
    subject = db.query(TutorSubject).filter(TutorSubject.id == subject_id, TutorSubject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Class not found")
    return subject


def _site_by_slug(db: Session, slug: str) -> FounderSite:
    site = db.query(FounderSite).filter(FounderSite.slug == slug).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


# ─── Public routes ───────────────────────────────────────────────────────────
@public_router.get("/{slug}")
def get_public_tutor(slug: str, db: Session = Depends(get_db)):
    site = _site_by_slug(db, slug)
    subjects = (
        db.query(TutorSubject)
        .filter(TutorSubject.user_id == site.user_id, TutorSubject.status == "published")
        .order_by(TutorSubject.sort_order, TutorSubject.id)
        .all()
    )
    videos = (
        db.query(TutorVideo)
        .filter(TutorVideo.user_id == site.user_id)
        .order_by(TutorVideo.sort_order, TutorVideo.id)
        .all()
    )
    settings = _get_settings(db, site.user_id)
    return {
        "settings": {k: v for k, v in settings.items() if k in PUBLIC_SETTING_KEYS},
        "subjects": [_serialize_subject(s) for s in subjects],
        "videos": [_serialize_video(v) for v in videos],
    }


@public_router.get("/{slug}/availability")
def get_public_availability(slug: str, subject_id: int, days: int = 14, db: Session = Depends(get_db)):
    days = max(1, min(days, 45))
    site = _site_by_slug(db, slug)
    subject = (
        db.query(TutorSubject)
        .filter(TutorSubject.id == subject_id, TutorSubject.user_id == site.user_id, TutorSubject.status == "published")
        .first()
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Class not found")
    settings = _get_settings(db, site.user_id)
    if not settings.get("bookingEnabled"):
        return {"days": []}

    tz_name = settings.get("timezone") or "Asia/Kolkata"
    today = _now_in(tz_name).date()
    max_day = today + timedelta(days=int(settings.get("advanceBookingDays") or 21))
    out = []
    d = today
    while d <= min(today + timedelta(days=days - 1), max_day):
        slots = _generate_slots(db, site.user_id, settings, d, subject.duration_minutes)
        if slots:
            out.append({"date": d.isoformat(), "slots": slots})
        d += timedelta(days=1)
    return {"days": out}


@public_router.post("/{slug}/bookings", status_code=status.HTTP_201_CREATED)
def request_booking(slug: str, body: BookingRequest, db: Session = Depends(get_db)):
    site = _site_by_slug(db, slug)

    # Lock the teacher's settings row so two students can't grab the same slot at once.
    settings_row = (
        db.query(TutorSettings).filter(TutorSettings.user_id == site.user_id).with_for_update().first()
    )
    if not settings_row:
        settings_row = TutorSettings(user_id=site.user_id, settings={})
        db.add(settings_row)
        db.flush()
    settings = {**DEFAULT_SETTINGS, **(settings_row.settings or {})}

    if not settings.get("bookingEnabled"):
        raise HTTPException(status_code=409, detail="Online booking is closed right now. Send an enquiry instead.")

    subject = (
        db.query(TutorSubject)
        .filter(TutorSubject.id == body.subject_id, TutorSubject.user_id == site.user_id, TutorSubject.status == "published")
        .first()
    )
    if not subject:
        raise HTTPException(status_code=404, detail="Class not found")
    if body.is_trial and not subject.trial_available:
        raise HTTPException(status_code=422, detail="A trial class isn't offered for this subject.")

    tz_name = settings.get("timezone") or "Asia/Kolkata"
    today = _now_in(tz_name).date()
    max_day = today + timedelta(days=int(settings.get("advanceBookingDays") or 21))
    if body.class_date < today or body.class_date > max_day:
        raise HTTPException(status_code=422, detail="That date is outside the booking window.")

    available = _generate_slots(db, site.user_id, settings, body.class_date, subject.duration_minutes)
    match = next((s for s in available if s["startTime"] == body.start_time.strftime("%H:%M")), None)
    if not match:
        raise HTTPException(status_code=409, detail="That time was just taken or is no longer available. Please pick another slot.")

    price = Decimal(0) if body.is_trial and subject.trial_price is None else (
        Decimal(subject.trial_price) if body.is_trial else (Decimal(subject.price) if subject.price is not None else Decimal(0))
    )

    booking = TutorBooking(
        owner_user_id=site.user_id,
        subject_id=subject.id,
        student_name=body.student_name.strip(),
        phone=body.phone.strip(),
        email=(body.email or "").strip() or None,
        notes=body.notes.strip(),
        class_date=body.class_date,
        start_time=body.start_time,
        end_time=time.fromisoformat(match["endTime"]),
        is_trial=body.is_trial,
        price=price,
        status="requested",
        hold_expires_at=datetime.now(dt_timezone.utc) + timedelta(minutes=int(settings.get("holdMinutes") or 20)),
    )
    db.add(booking)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save the booking. Please try again.")
    db.refresh(booking)

    # Payment hook (paid trials / paid classes): create an order for booking.price here and
    # return it as "payment"; the gateway webhook should then PATCH the booking to confirmed
    # with a meetLink, the same way payment_routes.py already grants community membership.
    return {"booking": _serialize_booking(booking), "payment": None}


# ─── Owner routes ────────────────────────────────────────────────────────────
@owner_router.get("/subjects")
def list_subjects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    subjects = (
        db.query(TutorSubject)
        .filter(TutorSubject.user_id == user.id)
        .order_by(TutorSubject.sort_order, TutorSubject.id)
        .all()
    )
    return [_serialize_subject(s) for s in subjects]


@owner_router.post("/subjects", status_code=status.HTTP_201_CREATED)
def create_subject(body: SubjectIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.status == "published":
        errs = _publish_errors(body)
        if errs:
            raise HTTPException(status_code=422, detail="Cannot publish: " + "; ".join(errs))
    site = db.query(FounderSite).filter(FounderSite.user_id == user.id).first()
    subject = TutorSubject(
        user_id=user.id, founder_site_id=site.id if site else None,
        slug=_unique_slug(db, user.id, body.slug or body.title),
        **body.model_dump(exclude={"slug"}),
    )
    db.add(subject)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save the class.")
    db.refresh(subject)
    return _serialize_subject(subject)


@owner_router.put("/subjects/{subject_id}")
def update_subject(subject_id: int, body: SubjectIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    subject = _owned_subject(db, user, subject_id)
    if body.status == "published":
        errs = _publish_errors(body)
        if errs:
            raise HTTPException(status_code=422, detail="Cannot publish: " + "; ".join(errs))
    subject.slug = _unique_slug(db, user.id, body.slug or body.title, exclude_id=subject.id)
    for field, value in body.model_dump(exclude={"slug"}).items():
        setattr(subject, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save the class.")
    db.refresh(subject)
    return _serialize_subject(subject)


@owner_router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    subject = _owned_subject(db, user, subject_id)
    has_bookings = db.query(TutorBooking.id).filter(TutorBooking.subject_id == subject.id).first()
    if has_bookings:
        subject.status = "archived"  # keep history for past students and records
        db.commit()
        return {"archived": True}
    db.delete(subject)
    db.commit()
    return {"deleted": True}


@owner_router.get("/videos")
def list_videos(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    videos = db.query(TutorVideo).filter(TutorVideo.user_id == user.id).order_by(TutorVideo.sort_order, TutorVideo.id).all()
    return [_serialize_video(v) for v in videos]


@owner_router.post("/videos", status_code=status.HTTP_201_CREATED)
def create_video(body: VideoIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.subject_id is not None:
        _owned_subject(db, user, body.subject_id)  # 404s if not the caller's subject
    video = TutorVideo(user_id=user.id, **body.model_dump())
    db.add(video)
    db.commit()
    db.refresh(video)
    return _serialize_video(video)


@owner_router.delete("/videos/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    video = db.query(TutorVideo).filter(TutorVideo.id == video_id, TutorVideo.user_id == user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    db.delete(video)
    db.commit()
    return {"deleted": True}


@owner_router.get("/availability")
def list_availability(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    windows = (
        db.query(TutorAvailability)
        .filter(TutorAvailability.user_id == user.id)
        .order_by(TutorAvailability.weekday, TutorAvailability.start_time)
        .all()
    )
    return [_serialize_window(w) for w in windows]


@owner_router.put("/availability")
def replace_availability(body: AvailabilityReplace, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Validate no two windows overlap on the same weekday before writing anything.
    by_day: dict = {}
    for w in body.windows:
        by_day.setdefault(w.weekday, []).append(w)
    for weekday, windows in by_day.items():
        windows.sort(key=lambda w: w.start_time)
        for a, b in zip(windows, windows[1:]):
            if a.end_time > b.start_time:
                raise HTTPException(status_code=422, detail=f"Overlapping windows on weekday {weekday}.")

    db.query(TutorAvailability).filter(TutorAvailability.user_id == user.id).delete()
    for w in body.windows:
        db.add(TutorAvailability(
            user_id=user.id, weekday=w.weekday,
            start_time=w.start_time, end_time=w.end_time, is_active=w.is_active,
        ))
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save your schedule.")
    return list_availability(db=db, user=user)


@owner_router.get("/settings")
def get_settings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _get_settings(db, user.id)


@owner_router.put("/settings")
def save_settings(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    clean = {k: v for k, v in body.items() if k in DEFAULT_SETTINGS}
    if "bufferMinutes" in clean and (not isinstance(clean["bufferMinutes"], (int, float)) or clean["bufferMinutes"] < 0):
        raise HTTPException(status_code=422, detail="Buffer time must be a positive number of minutes.")
    row = db.query(TutorSettings).filter(TutorSettings.user_id == user.id).first()
    if not row:
        row = TutorSettings(user_id=user.id, settings={})
        db.add(row)
    row.settings = {**DEFAULT_SETTINGS, **(row.settings or {}), **clean}
    db.commit()
    return row.settings


@owner_router.get("/bookings")
def list_bookings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(TutorBooking)
        .filter(TutorBooking.owner_user_id == user.id)
        .order_by(TutorBooking.class_date.desc(), TutorBooking.start_time.desc())
        .limit(500)
        .all()
    )
    return [_serialize_booking(b) for b in rows]


@owner_router.patch("/bookings/{booking_id}")
def update_booking(booking_id: int, body: BookingPatch, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    b = db.query(TutorBooking).filter(TutorBooking.id == booking_id, TutorBooking.owner_user_id == user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    if b.status != body.status and body.status not in ALLOWED_TRANSITIONS[b.status]:
        raise HTTPException(status_code=409, detail=f"Can't change a {b.status} booking to {body.status}.")

    b.status = body.status
    if body.status != "requested":
        b.hold_expires_at = None
    if body.status == "confirmed" and not b.meet_link:
        settings = _get_settings(db, user.id)
        b.meet_link = body.meet_link or settings.get("defaultMeetLink") or None
    elif body.meet_link:
        b.meet_link = body.meet_link

    db.commit()
    db.refresh(b)
    return _serialize_booking(b)
