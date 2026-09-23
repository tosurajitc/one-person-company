"""
ad_agent_routes.py

FastAPI API endpoints for the 4-tier Autonomous Ad Management Suite.
Each tier supports:
1. AI Orchestration generation (generates DRAFT state)
2. Human-In-The-Loop review & verification (promotes to VERIFIED state)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging
from typing import Dict, Any

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.ad_management_service import (
    get_or_create_ad_state,
    generate_ad_audit,
    verify_ad_audit,
    generate_tracking_blueprint,
    verify_tracking_blueprint,
    generate_ad_creatives,
    verify_ad_creatives,
    generate_performance_diagnostics,
    verify_performance_diagnostics,
    get_campaign_launch_brief,
)
from app.schemas.ad_management import (
    AuditGenerateRequest,
    AuditVerifyRequest,
    TrackingGenerateRequest,
    TrackingVerifyRequest,
    CreativeGenerateRequest,
    CreativeVerifyRequest,
    DiagnosticsGenerateRequest,
    DiagnosticsVerifyRequest,
    AdManagementFullStateResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ad-agent", tags=["ad-agent"])


# ── Global Ad State ────────────────────────────────────────────────────────

@router.get("/state")
def get_ad_suite_state(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves full multi-tier state for the current authenticated user."""
    state = get_or_create_ad_state(db, current_user.id)
    return state.to_dict()


# ── Tier 1: Ad Account Audit ───────────────────────────────────────────────

@router.post("/audit/generate")
def run_ad_audit_agent(
    req: AuditGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Triggers AI Agent to generate automated Audit Scorecard & Findings (Status: DRAFT)."""
    return generate_ad_audit(
        db=db,
        user_id=current_user.id,
        category_id=req.category_id,
        niche_name=req.niche_name,
        monthly_spend=req.monthly_spend,
        current_roas=req.current_roas,
        main_pain_point=req.main_pain_point,
    )


@router.post("/audit/verify")
def approve_ad_audit_state(
    req: AuditVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Human-in-the-loop: User approves audit findings and locks Tier 1 (Status: VERIFIED)."""
    return verify_ad_audit(
        db=db,
        user_id=current_user.id,
        findings=req.findings,
        action_plan=req.action_plan,
        audit_score=req.audit_score,
    )


# ── Tier 2: Setup & Tracking Blueprint ─────────────────────────────────────

@router.post("/tracking/generate")
def run_tracking_blueprint_agent(
    req: TrackingGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Triggers AI Agent to generate CAPI event mapping & funnel architecture (Status: DRAFT)."""
    return generate_tracking_blueprint(
        db=db,
        user_id=current_user.id,
        pixel_id=req.pixel_id,
        website_url=req.website_url,
        category_id=req.category_id,
        niche_name=req.niche_name,
    )


@router.post("/tracking/verify")
def approve_tracking_blueprint_state(
    req: TrackingVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Human-in-the-loop: User approves tracking blueprint and locks Tier 2 (Status: VERIFIED)."""
    return verify_tracking_blueprint(
        db=db,
        user_id=current_user.id,
        pixel_id=req.pixel_id,
        capi_configured=req.capi_configured,
        event_mapping=req.event_mapping,
        funnel_architecture=req.funnel_architecture,
    )


# ── Tier 3: Creatives & Copywriting ────────────────────────────────────────

@router.post("/creatives/generate")
def run_creatives_agent(
    req: CreativeGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Triggers AI Agent to generate multi-angle ad copies (Status: DRAFT)."""
    return generate_ad_creatives(
        db=db,
        user_id=current_user.id,
        category_id=req.category_id,
        niche_name=req.niche_name,
        product_name=req.product_name,
        target_audience=req.target_audience,
        tone=req.tone,
        count=req.count or 3,
    )


@router.post("/creatives/verify")
def approve_creatives_state(
    req: CreativeVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Human-in-the-loop: User approves selected copies and locks Tier 3 (Status: VERIFIED)."""
    return verify_ad_creatives(
        db=db,
        user_id=current_user.id,
        copies=req.copies,
    )


# ── Tier 4: Performance Diagnostics & Optimization Rules ──────────────────

@router.post("/diagnostics/generate")
def run_diagnostics_agent(
    req: DiagnosticsGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Triggers AI Agent to generate weekly KPI diagnostics and kill/scale rules (Status: DRAFT)."""
    return generate_performance_diagnostics(
        db=db,
        user_id=current_user.id,
        category_id=req.category_id,
        niche_name=req.niche_name,
    )


# ── Campaign Launch Brief ──────────────────────────────────────────────────

@router.get("/launch-brief")
def get_launch_brief(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns consolidated Campaign Launch Brief JSON for all 4 verified tiers."""
    return get_campaign_launch_brief(db=db, user_id=current_user.id)


@router.post("/diagnostics/verify")
def approve_diagnostics_state(
    req: DiagnosticsVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Human-in-the-loop: User approves metrics and rules and locks Tier 4 (Status: VERIFIED)."""
    return verify_performance_diagnostics(
        db=db,
        user_id=current_user.id,
        metrics=req.metrics,
        rules=req.rules,
    )
