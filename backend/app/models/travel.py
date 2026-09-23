"""Travel Creator & Tour Organiser template (travel-host) — data models.

Tables (all new, additive — see migration m8n9o0p1q2r3):
  travel_packages    one row per trip a founder sells
  travel_departures  dated departures of a package with seat counts
  travel_bookings    seat requests from the public site (never hard-deleted)
  travel_settings    per-founder booking settings (deposit, holds, cancellation policy)

Seat accounting:
  seats_booked  stored; includes offline sales the founder enters + online bookings
                that reached deposit_paid / confirmed
  seats held    NOT stored; computed from bookings in status "requested" whose
                hold_expires_at is still in the future, so expired holds free
                themselves without a background job.
"""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Index, Integer, Numeric,
    String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class TravelPackage(Base):
    __tablename__ = "travel_packages"
    __table_args__ = (
        UniqueConstraint("user_id", "slug", name="uq_travel_packages_user_slug"),
        Index("ix_travel_packages_user_status", "user_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    founder_site_id = Column(Integer, ForeignKey("founder_sites.id", ondelete="SET NULL"), nullable=True)

    slug = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    destination = Column(String(200), nullable=True)
    region = Column(String(20), nullable=False, default="india")          # india | international
    trip_type = Column(String(30), nullable=False, default="group")       # group | weekend | trek | women-only | pilgrimage | custom
    duration_days = Column(Integer, nullable=False, default=1)
    duration_nights = Column(Integer, nullable=False, default=0)
    start_city = Column(String(120), nullable=True)

    price_twin = Column(Numeric(12, 2), nullable=True)
    price_triple = Column(Numeric(12, 2), nullable=True)
    price_single = Column(Numeric(12, 2), nullable=True)
    deposit_override = Column(Numeric(12, 2), nullable=True)              # ₹ per traveller

    difficulty = Column(String(20), nullable=False, default="easy")       # easy | moderate | challenging
    min_age = Column(Integer, nullable=True)
    group_size_max = Column(Integer, nullable=True)

    cover_image = Column(String(500), nullable=True)
    youtube_video_id = Column(String(32), nullable=True)
    summary = Column(Text, nullable=True)
    highlights = Column(JSONB, nullable=False, default=list)
    itinerary = Column(JSONB, nullable=False, default=list)               # [{day,title,description,stay,meals}]
    inclusions = Column(JSONB, nullable=False, default=list)
    exclusions = Column(JSONB, nullable=False, default=list)
    stay_type = Column(String(200), nullable=True)
    transport = Column(String(200), nullable=True)
    visa_support = Column(Boolean, nullable=False, default=False)

    status = Column(String(20), nullable=False, default="draft")          # draft | published | archived
    booking_enabled = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    departures = relationship(
        "TravelDeparture", back_populates="package",
        cascade="all, delete-orphan", order_by="TravelDeparture.start_date",
    )


class TravelDeparture(Base):
    __tablename__ = "travel_departures"
    __table_args__ = (Index("ix_travel_departures_package_date", "package_id", "start_date"),)

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("travel_packages.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    seats_total = Column(Integer, nullable=False, default=16)
    seats_booked = Column(Integer, nullable=False, default=0)
    price_override = Column(Numeric(12, 2), nullable=True)                # replaces twin price for this date
    status = Column(String(20), nullable=False, default="open")           # open | closed | cancelled
    booking_enabled = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    package = relationship("TravelPackage", back_populates="departures")


class TravelBooking(Base):
    __tablename__ = "travel_bookings"
    __table_args__ = (
        Index("ix_travel_bookings_owner_status", "owner_user_id", "status"),
        Index("ix_travel_bookings_departure_status", "departure_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # RESTRICT: a package/departure with bookings can never be hard-deleted.
    package_id = Column(Integer, ForeignKey("travel_packages.id", ondelete="RESTRICT"), nullable=False)
    departure_id = Column(Integer, ForeignKey("travel_departures.id", ondelete="RESTRICT"), nullable=False)

    name = Column(String(200), nullable=False)
    phone = Column(String(40), nullable=False)
    email = Column(String(255), nullable=True)
    travellers = Column(Integer, nullable=False, default=1)
    sharing = Column(String(10), nullable=False, default="twin")          # twin | triple | single
    notes = Column(Text, nullable=True)

    per_person_price = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    deposit_amount = Column(Numeric(12, 2), nullable=False, default=0)

    status = Column(String(20), nullable=False, default="requested")      # requested | deposit_paid | confirmed | cancelled
    hold_expires_at = Column(DateTime(timezone=True), nullable=True)
    payment_id = Column(String(120), nullable=True)                       # gateway payment id once the deposit is paid

    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    package = relationship("TravelPackage")
    departure = relationship("TravelDeparture")


class TravelSettings(Base):
    __tablename__ = "travel_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    settings = Column(JSONB, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)