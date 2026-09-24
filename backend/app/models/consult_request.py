"""ConsultRequest: a visitor's consultation request to a founder's study-abroad site (V1).

Additive only. Import Base from app.core.database (never app/db/*).

ASSUMPTION: founder_sites.id is an Integer. If it is a UUID, change the
founder_site_id column type here and in the migration to match.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base

CONSULT_STATUSES = ("new", "qualified", "consultation_booked", "closed")


class ConsultRequest(Base):
    __tablename__ = "consult_requests"

    id = Column(Integer, primary_key=True, index=True)
    # Public reference the visitor can quote later (and V2 can attach a student portal to).
    ref = Column(String(16), unique=True, nullable=False, index=True)
    founder_site_id = Column(
        Integer, ForeignKey("founder_sites.id", ondelete="CASCADE"), nullable=False, index=True
    )

    consultation_type = Column(String(64), nullable=False)
    mode = Column(String(32), nullable=True)
    preferred_window = Column(JSONB, nullable=True)  # {date, part_of_day}
    timezone = Column(String(64), nullable=True)

    # Denormalised for the inbox list and duplicate check.
    full_name = Column(String(200), nullable=False)
    email = Column(String(254), nullable=False, index=True)
    phone = Column(String(40), nullable=True)

    profile = Column(JSONB, nullable=False, default=dict)  # built-in pre-screen answers
    custom = Column(JSONB, nullable=False, default=dict)  # answers to the owner's custom questions
    consent = Column(JSONB, nullable=False, default=dict)  # {accepted, policy_version, timestamp}

    status = Column(String(32), nullable=False, default="new", server_default="new")
    owner_notes = Column(Text, nullable=True)
    source_ip_hash = Column(String(64), nullable=True)  # salted hash, never the raw address
    webhook_status = Column(String(32), nullable=True)  # null | sent | failed | skipped

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_consult_requests_site_status_created", "founder_site_id", "status", "created_at"),
    )
