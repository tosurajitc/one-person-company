"""
ad_management.py

Pydantic validation schemas for the 4-tier Autonomous Ad Management Suite:
1. Audit Scorecard & Intake
2. Setup & CAPI Tracking Blueprint
3. Creative Angle Generator & Multi-Format Copy
4. Performance Diagnostics & Optimization Rules
"""

from __future__ import annotations
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime


# ── Tier 1 Schemas: Audit ──────────────────────────────────────────────────

class AuditFinding(BaseModel):
    severity: Literal["high", "medium", "low"]
    category: str
    issue: str
    impact: str
    fix: str


class AuditGenerateRequest(BaseModel):
    category_id: str = Field(default="product-commerce", description="Top level industry category")
    niche_name: str = Field(default="D2C Apparel & Fashion", description="Specific industry niche")
    monthly_spend: Optional[str] = Field(default="₹50,000", description="Monthly Meta ad spend")
    current_roas: Optional[str] = Field(default="2.2x", description="Current blended ROAS")
    main_pain_point: Optional[str] = Field(
        default="High customer acquisition cost and ad fatigue on Meta",
        description="User's primary advertising problem"
    )


class AuditVerifyRequest(BaseModel):
    findings: Optional[List[AuditFinding]] = None
    action_plan: Optional[List[str]] = None
    audit_score: Optional[int] = None


# ── Tier 2 Schemas: Tracking & Blueprint ───────────────────────────────────

class TrackingEventItem(BaseModel):
    name: str
    status: str  # Free-form descriptor e.g. "Browser + Server (CAPI Active)" or "active"
    matchQuality: Optional[str] = None
    fix: Optional[str] = None


class FunnelStage(BaseModel):
    objective: str
    budgetShare: str
    targetRoas: Optional[str] = None
    formats: Optional[List[str]] = None


class FunnelArchitecture(BaseModel):
    tof: Optional[Dict[str, Any]] = None
    mof: Optional[Dict[str, Any]] = None
    bof: Optional[Dict[str, Any]] = None


class TrackingGenerateRequest(BaseModel):
    pixel_id: Optional[str] = None
    website_url: Optional[str] = None
    category_id: Optional[str] = None
    niche_name: Optional[str] = None


class TrackingVerifyRequest(BaseModel):
    pixel_id: Optional[str] = None
    capi_configured: Optional[bool] = True
    event_mapping: Optional[List[Dict[str, Any]]] = None
    funnel_architecture: Optional[Dict[str, Any]] = None


# ── Tier 3 Schemas: Creatives & Copywriting ────────────────────────────────

class GeneratedCopyItem(BaseModel):
    id: int
    angle: str
    headline: str
    primaryText: str
    cta: str
    isApproved: bool = False


class CreativeGenerateRequest(BaseModel):
    category_id: Optional[str] = None
    niche_name: Optional[str] = None
    product_name: Optional[str] = Field(default="Flagship Offer", description="Product or service name")
    target_audience: Optional[str] = Field(default="Modern conscious buyers", description="Target audience description")
    tone: Optional[str] = Field(default="Direct & Compelling", description="Tone of voice")
    count: Optional[int] = Field(default=3, ge=1, le=10)


class CreativeVerifyRequest(BaseModel):
    copies: List[Dict[str, Any]]


# ── Tier 4 Schemas: Performance Diagnostics & Optimization Rules ──────────

class PerformanceMetricItem(BaseModel):
    metric: str
    term: Optional[str] = None
    definition: Optional[str] = None
    value: str
    target: str
    status: Literal["good", "warning", "critical"]
    note: Optional[str] = None


class OptimizationRuleItem(BaseModel):
    id: int
    type: Literal["kill", "scale", "refresh"]
    description: str
    isEnabled: bool = True


class DiagnosticsGenerateRequest(BaseModel):
    current_metrics: Optional[List[Dict[str, Any]]] = None
    category_id: Optional[str] = None
    niche_name: Optional[str] = None


class DiagnosticsVerifyRequest(BaseModel):
    metrics: Optional[List[Dict[str, Any]]] = None
    rules: Optional[List[Dict[str, Any]]] = None


# ── Full State Response ────────────────────────────────────────────────────

class AdManagementFullStateResponse(BaseModel):
    id: int
    user_id: int
    category_id: str
    niche_name: str
    monthly_ad_spend: Optional[str] = None
    audit: Dict[str, Any]
    tracking: Dict[str, Any]
    creatives: Dict[str, Any]
    diagnostics: Dict[str, Any]
    updated_at: Optional[str] = None
