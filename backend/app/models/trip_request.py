"""
Trip Architect — SQLAlchemy models
Sibling to app/models/travel.py — do not edit that file, this is additive.

Three new tables, no changes to any existing table:
  - trip_requests        one row per traveller's brief
  - trip_options         2-3 compared stay/transport/guide/activity options per request
  - trip_itinerary_days  the day-by-day plan once one is built

Reminder (AGENTS.md safety rules):
  - Import Base only from app.core.database — never app/db/session.py or app/db/base.py
  - Import this module in alembic/env.py before running --autogenerate
  - New columns on NEW tables may be NOT NULL; the "additive/nullable" rule
    applies to ALTER on existing tables, not fresh CREATE TABLE here
"""

from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Numeric, Date, DateTime,
    ForeignKey, UniqueConstraint, Index, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from ..core.database import Base


class TripRequestStatus:
    """Pipeline stages — kept as plain string constants, not a DB enum type,
    so adding a stage later is a data change, not a migration."""
    NEW = 'new'
    RESEARCHING = 'researching'
    PROPOSED = 'proposed'
    CONFIRMED = 'confirmed'
    COMPLETED = 'completed'
    ARCHIVED = 'archived'

    ALL = (NEW, RESEARCHING, PROPOSED, CONFIRMED, COMPLETED, ARCHIVED)


class TripOptionCategory:
    STAY = 'stay'
    TRANSPORT = 'transport'
    GUIDE = 'guide'
    ACTIVITY = 'activity'

    ALL = (STAY, TRANSPORT, GUIDE, ACTIVITY)


class TripRequest(Base):
    """One traveller's brief, from first submission through to a delivered
    itinerary. Owned by a founder's trip-architect site."""

    __tablename__ = 'trip_requests'

    id = Column(Integer, primary_key=True, autoincrement=True)

    founder_site_id = Column(
        Integer, ForeignKey('founder_sites.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )

    # Traveller contact
    traveller_name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)

    # Brief
    destinations = Column(JSONB, nullable=False, default=list)          # list[str]
    date_mode = Column(String(20), nullable=False, default='fixed')      # 'fixed' | 'flexible'
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    flex_window_notes = Column(Text, nullable=True)                      # e.g. "sometime in March, ~10 days"
    traveller_count = Column(Integer, nullable=True)
    ages = Column(JSONB, nullable=True)                                  # list[int], optional
    interests = Column(JSONB, nullable=True)                             # list[str]
    pace = Column(String(20), nullable=True)                             # 'relaxed' | 'balanced' | 'packed'
    dietary_needs = Column(Text, nullable=True)
    accessibility_needs = Column(Text, nullable=True)
    budget_min = Column(Numeric(12, 2), nullable=True)
    budget_max = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), nullable=False, default='INR')
    message = Column(Text, nullable=True)                                # free-text notes from the brief form

    # Pipeline
    status = Column(String(20), nullable=False, default=TripRequestStatus.NEW, index=True)

    # Shareable read-only itinerary link (set once a plan is ready to send)
    share_token = Column(String(64), nullable=True, unique=True, index=True)
    share_token_created_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    options = relationship(
        'TripOption', back_populates='trip_request',
        cascade='all, delete-orphan', order_by='TripOption.sort_order',
    )
    itinerary_days = relationship(
        'TripItineraryDay', back_populates='trip_request',
        cascade='all, delete-orphan', order_by='TripItineraryDay.day_number',
    )

    def to_dict(self, include_relations: bool = False) -> dict:
        data = {
            'id': self.id,
            'founder_site_id': self.founder_site_id,
            'traveller_name': self.traveller_name,
            'email': self.email,
            'phone': self.phone,
            'destinations': self.destinations or [],
            'date_mode': self.date_mode,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'flex_window_notes': self.flex_window_notes,
            'traveller_count': self.traveller_count,
            'ages': self.ages or [],
            'interests': self.interests or [],
            'pace': self.pace,
            'dietary_needs': self.dietary_needs,
            'accessibility_needs': self.accessibility_needs,
            'budget_min': float(self.budget_min) if self.budget_min is not None else None,
            'budget_max': float(self.budget_max) if self.budget_max is not None else None,
            'currency': self.currency,
            'message': self.message,
            'status': self.status,
            'share_token': self.share_token,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_relations:
            data['options'] = [o.to_dict() for o in self.options]
            data['itinerary_days'] = [d.to_dict() for d in self.itinerary_days]
        return data


class TripOption(Base):
    """A single compared option (a stay, a transfer, a guide, an activity)
    logged against a request. 2-3 of these per category let the founder
    show a choice instead of forcing one booking."""

    __tablename__ = 'trip_options'

    id = Column(Integer, primary_key=True, autoincrement=True)

    trip_request_id = Column(
        Integer, ForeignKey('trip_requests.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )

    category = Column(String(20), nullable=False)   # 'stay' | 'transport' | 'guide' | 'activity'
    title = Column(String(255), nullable=False)
    provider_contact = Column(String(255), nullable=True)
    price = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), nullable=False, default='INR')
    inclusions = Column(JSONB, nullable=True)        # list[str]
    cancellation_terms = Column(Text, nullable=True)
    is_recommended = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    trip_request = relationship('TripRequest', back_populates='options')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'trip_request_id': self.trip_request_id,
            'category': self.category,
            'title': self.title,
            'provider_contact': self.provider_contact,
            'price': float(self.price) if self.price is not None else None,
            'currency': self.currency,
            'inclusions': self.inclusions or [],
            'cancellation_terms': self.cancellation_terms,
            'is_recommended': self.is_recommended,
            'sort_order': self.sort_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class TripItineraryDay(Base):
    """One day of the finished plan. Shape matches what
    components/travel/TripArchitectSite.js's itinerary renderer (reused
    from TravelHostSite.js) already expects — no frontend changes needed
    to display this once it's wired in."""

    __tablename__ = 'trip_itinerary_days'
    __table_args__ = (
        UniqueConstraint('trip_request_id', 'day_number', name='uq_trip_itinerary_day_number'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    trip_request_id = Column(
        Integer, ForeignKey('trip_requests.id', ondelete='CASCADE'),
        nullable=False, index=True,
    )

    day_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=True)                # e.g. "Kyoto — temples & tea"
    sightseeing_order = Column(JSONB, nullable=True)           # list[str], ordered stops
    travel_time_notes = Column(Text, nullable=True)
    rest_time_notes = Column(Text, nullable=True)
    entry_fees = Column(Text, nullable=True)
    meal_suggestions = Column(Text, nullable=True)
    estimated_food_spend = Column(Numeric(10, 2), nullable=True)
    local_transport_notes = Column(Text, nullable=True)
    contingency_notes = Column(Text, nullable=True)

    trip_request = relationship('TripRequest', back_populates='itinerary_days')

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'trip_request_id': self.trip_request_id,
            'day_number': self.day_number,
            'title': self.title,
            'sightseeing_order': self.sightseeing_order or [],
            'travel_time_notes': self.travel_time_notes,
            'rest_time_notes': self.rest_time_notes,
            'entry_fees': self.entry_fees,
            'meal_suggestions': self.meal_suggestions,
            'estimated_food_spend': float(self.estimated_food_spend) if self.estimated_food_spend is not None else None,
            'local_transport_notes': self.local_transport_notes,
            'contingency_notes': self.contingency_notes,
        }


# ─── Deferred (Phase 2 — not part of this migration) ──────────────────────────
# trip_support_sessions — for the "supporting the customer during travel"
# add-on described in the positioning brief. Left out of this file and this
# phase's migration deliberately: add it as its own additive migration when
# Phase 2 is actually scheduled, per Safety Rule #2 (additive migrations,
# one concern per migration). Sketch, for reference when that phase starts:
#
#   trip_support_sessions
#     id, trip_request_id (FK -> trip_requests.id, CASCADE),
#     channel (String), active_from (DateTime), active_to (DateTime),
#     fee (Numeric), created_at