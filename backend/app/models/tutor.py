"""Tutor, Trainer & Creative Teacher template (tutor-training) — data models.

Tables (all new, additive — see migration for the exact revision id):
  tutor_subjects       one row per class/subject a teacher offers (music, maths, art, ...)
  tutor_videos         past-class / recital / demo clips shown on the public site
  tutor_availability   weekly recurring teaching windows (Mon 4pm-7pm, etc.)
  tutor_bookings       student class requests (never hard-deleted)
  tutor_settings       per-teacher booking settings (Meet link, buffer, notice window)

Slot accounting mirrors travel.py's seat-hold pattern, adapted to time-of-day:
  A booking in status "requested" HOLDS its (date, start_time..end_time) window for
  settings.holdMinutes. Nothing is stored for "held" separately — it's computed from
  bookings whose status == 'requested' and hold_expires_at is still in the future, so
  an abandoned hold frees itself without a background job.

Concurrency: because slots aren't backed by a single row the way a travel departure is,
booking creation takes a row lock on the teacher's TutorSettings row (creating one if
needed) to serialise concurrent booking attempts for the same teacher before re-checking
availability. See tutor_routes.py::request_booking.
"""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Index, Integer, Numeric,
    SmallInteger, String, Text, Time, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class TutorSubject(Base):
    __tablename__ = "tutor_subjects"
    __table_args__ = (
        UniqueConstraint("user_id", "slug", name="uq_tutor_subjects_user_slug"),
        Index("ix_tutor_subjects_user_status", "user_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    founder_site_id = Column(Integer, ForeignKey("founder_sites.id", ondelete="SET NULL"), nullable=True)

    slug = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    # academic | music | art_design | dance | languages | coding_tech | test_prep | fitness_wellness | other
    category = Column(String(30), nullable=False, default="academic")
    # one_on_one | small_group | workshop
    format = Column(String(20), nullable=False, default="one_on_one")
    # beginner | intermediate | advanced | all_levels
    level = Column(String(20), nullable=False, default="all_levels")
    age_groups = Column(JSONB, nullable=False, default=list)   # ["kids","teens","adults"]

    duration_minutes = Column(Integer, nullable=False, default=60)
    group_size_max = Column(Integer, nullable=True)            # used when format != one_on_one

    price = Column(Numeric(10, 2), nullable=True)              # per class
    trial_available = Column(Boolean, nullable=False, default=True)
    trial_price = Column(Numeric(10, 2), nullable=True)        # null = free trial

    package_classes = Column(Integer, nullable=True)           # e.g. 4-class pack
    package_price = Column(Numeric(10, 2), nullable=True)

    cover_image = Column(String(500), nullable=True)
    summary = Column(Text, nullable=True)
    syllabus = Column(JSONB, nullable=False, default=list)      # ["Topic 1", "Topic 2", ...]
    prerequisites = Column(Text, nullable=True)

    status = Column(String(20), nullable=False, default="draft")  # draft | published | archived
    sort_order = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    videos = relationship("TutorVideo", back_populates="subject")


class TutorVideo(Base):
    __tablename__ = "tutor_videos"
    __table_args__ = (Index("ix_tutor_videos_user_sort", "user_id", "sort_order"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("tutor_subjects.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(200), nullable=False)
    youtube_video_id = Column(String(32), nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    subject = relationship("TutorSubject", back_populates="videos")


class TutorAvailability(Base):
    """One recurring weekly teaching window. Monday = 0 ... Sunday = 6."""
    __tablename__ = "tutor_availability"
    __table_args__ = (Index("ix_tutor_availability_user_weekday", "user_id", "weekday"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    weekday = Column(SmallInteger, nullable=False)      # 0-6, Monday first
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)


class TutorBooking(Base):
    __tablename__ = "tutor_bookings"
    __table_args__ = (
        Index("ix_tutor_bookings_owner_date", "owner_user_id", "class_date"),
        Index("ix_tutor_bookings_owner_status", "owner_user_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # RESTRICT: a subject with real bookings can never be hard-deleted (see delete_subject).
    subject_id = Column(Integer, ForeignKey("tutor_subjects.id", ondelete="RESTRICT"), nullable=False)

    student_name = Column(String(200), nullable=False)
    phone = Column(String(40), nullable=False)
    email = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    class_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    is_trial = Column(Boolean, nullable=False, default=False)
    price = Column(Numeric(10, 2), nullable=False, default=0)

    # requested | confirmed | completed | cancelled | no_show
    status = Column(String(20), nullable=False, default="requested")
    hold_expires_at = Column(DateTime(timezone=True), nullable=True)
    meet_link = Column(String(500), nullable=True)
    payment_id = Column(String(120), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    subject = relationship("TutorSubject")


class TutorSettings(Base):
    __tablename__ = "tutor_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    settings = Column(JSONB, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
