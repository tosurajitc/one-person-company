"""
ad_management_state.py

Stores the multi-step Human-In-The-Loop state for the Ad Management Suite.
Tracks each tier (Audit, Tracking/CAPI, Creatives & Copy, Diagnostics/Rules)
ensuring data is explicitly reviewed and verified by the user before transitioning states.
"""

from __future__ import annotations

import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class StepVerificationStatus(str, enum.Enum):
    DRAFT = "draft"                 # AI generated proposal, awaiting user review
    VERIFIED = "verified"           # User inspected and approved
    APPLIED = "applied"             # Deployed / Active
    ARCHIVED = "archived"


class AdManagementState(Base):
    __tablename__ = "ad_management_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Industry / Niche configuration
    category_id = Column(String(64), default="product-commerce", nullable=False)
    niche_name = Column(String(128), default="D2C Apparel & Fashion", nullable=False)
    monthly_ad_spend = Column(String(64), nullable=True)

    # ── Tier 1: Ad Account Audit ──
    audit_status = Column(SAEnum(StepVerificationStatus), default=StepVerificationStatus.DRAFT, nullable=False)
    audit_score = Column(Integer, nullable=True)
    audit_findings = Column(JSONB, nullable=True)     # List of { severity, category, issue, impact, fix }
    audit_action_plan = Column(JSONB, nullable=True)  # List of strings
    audit_verified_at = Column(DateTime(timezone=True), nullable=True)

    # ── Tier 2: Setup & Tracking Blueprint ──
    tracking_status = Column(SAEnum(StepVerificationStatus), default=StepVerificationStatus.DRAFT, nullable=False)
    pixel_id = Column(String(64), nullable=True)
    capi_configured = Column(Boolean, default=False, nullable=False)
    event_mapping = Column(JSONB, nullable=True)      # List of { name, status, matchQuality }
    funnel_architecture = Column(JSONB, nullable=True)# { tof: {...}, mof: {...}, bof: {...} }
    tracking_verified_at = Column(DateTime(timezone=True), nullable=True)

    # ── Tier 3: Creatives & Copywriting ──
    creative_status = Column(SAEnum(StepVerificationStatus), default=StepVerificationStatus.DRAFT, nullable=False)
    generated_copies = Column(JSONB, nullable=True)   # List of { id, angle, headline, primaryText, cta, isApproved }
    creatives_verified_at = Column(DateTime(timezone=True), nullable=True)

    # ── Tier 4: Performance Diagnostics & Optimization Rules ──
    diagnostics_status = Column(SAEnum(StepVerificationStatus), default=StepVerificationStatus.DRAFT, nullable=False)
    performance_metrics = Column(JSONB, nullable=True)# List of { metric, value, target, status, note }
    active_rules = Column(JSONB, nullable=True)       # List of { id, type: 'kill'|'scale', description, isEnabled }
    diagnostics_verified_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", backref="ad_management_state")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "niche_name": self.niche_name,
            "monthly_ad_spend": self.monthly_ad_spend,
            "audit": {
                "status": self.audit_status.value if hasattr(self.audit_status, "value") else str(self.audit_status),
                "score": self.audit_score,
                "findings": self.audit_findings or [],
                "action_plan": self.audit_action_plan or [],
                "verified_at": self.audit_verified_at.isoformat() if self.audit_verified_at else None,
            },
            "tracking": {
                "status": self.tracking_status.value if hasattr(self.tracking_status, "value") else str(self.tracking_status),
                "pixel_id": self.pixel_id,
                "capi_configured": self.capi_configured,
                "event_mapping": self.event_mapping or [],
                "funnel_architecture": self.funnel_architecture or {},
                "verified_at": self.tracking_verified_at.isoformat() if self.tracking_verified_at else None,
            },
            "creatives": {
                "status": self.creative_status.value if hasattr(self.creative_status, "value") else str(self.creative_status),
                "copies": self.generated_copies or [],
                "verified_at": self.creatives_verified_at.isoformat() if self.creatives_verified_at else None,
            },
            "diagnostics": {
                "status": self.diagnostics_status.value if hasattr(self.diagnostics_status, "value") else str(self.diagnostics_status),
                "metrics": self.performance_metrics or [],
                "rules": self.active_rules or [],
                "verified_at": self.diagnostics_verified_at.isoformat() if self.diagnostics_verified_at else None,
            },
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
