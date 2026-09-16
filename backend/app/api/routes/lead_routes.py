"""
Lead capture and funnel tracking API routes:
POST /api/leads            Public   Capture an email + UTM params + source tag. Idempotent on (email, source) within 24h.
GET  /api/leads            Admin    List leads, filterable by source, date range, converted/not-converted
GET  /api/leads/funnel     Admin    Aggregate counts per funnel stage: leads captured -> signups -> first offer created -> first sale
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.lead import Lead
from app.models.offer import Offer
from app.models.subscription import Payment, PaymentStatus

router = APIRouter(prefix="/leads", tags=["leads"])


class LeadCaptureRequest(BaseModel):
    email: EmailStr
    source: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    referrer_url: Optional[str] = None


@router.post("", status_code=status.HTTP_200_OK)
async def capture_lead(
    payload: LeadCaptureRequest,
    db: Session = Depends(get_db),
):
    """
    Capture an email + UTM params + source tag (Public).
    Idempotent on (email, source) within 24 hours — updates created_at and UTM params if present.
    """
    normalized_email = payload.email.strip().lower()
    source_val = payload.source.strip() if payload.source else None

    # Check if a lead with same email and source exists within the last 24 hours
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    query = db.query(Lead).filter(
        Lead.email == normalized_email,
        Lead.source == source_val
    )
    
    # We find existing lead with same email & source
    existing_lead = query.order_by(Lead.created_at.desc()).first()

    # Check if the user already exists in users table (in case they already signed up)
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    converted_id = existing_user.id if existing_user else None

    if existing_lead and existing_lead.created_at and existing_lead.created_at >= twenty_four_hours_ago:
        # Update existing lead's created_at and optionally UTM parameters
        existing_lead.created_at = datetime.utcnow()
        if payload.utm_source:
            existing_lead.utm_source = payload.utm_source
        if payload.utm_medium:
            existing_lead.utm_medium = payload.utm_medium
        if payload.utm_campaign:
            existing_lead.utm_campaign = payload.utm_campaign
        if payload.utm_content:
            existing_lead.utm_content = payload.utm_content
        if payload.referrer_url:
            existing_lead.referrer_url = payload.referrer_url
        if converted_id and not existing_lead.converted_to_user_id:
            existing_lead.converted_to_user_id = converted_id
            
        db.commit()
        db.refresh(existing_lead)
        return {
            "success": True,
            "message": "Lead updated successfully",
            "lead": existing_lead.to_dict()
        }

    # Create new lead row
    new_lead = Lead(
        email=normalized_email,
        source=source_val,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
        utm_content=payload.utm_content,
        referrer_url=payload.referrer_url,
        converted_to_user_id=converted_id,
        created_at=datetime.utcnow(),
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    return {
        "success": True,
        "message": "Lead captured successfully",
        "lead": new_lead.to_dict()
    }


@router.get("/funnel")
async def get_funnel_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Aggregate counts per funnel stage (Admin only):
    leads captured -> signups (converted leads) -> first offer created -> first sale
    """
    total_leads = db.query(func.count(Lead.id)).scalar() or 0
    
    # Unique lead emails
    unique_leads_count = db.query(func.count(distinct(Lead.email))).scalar() or 0
    
    # Converted leads (leads with converted_to_user_id not null)
    converted_leads_count = db.query(func.count(distinct(Lead.email))).filter(
        Lead.converted_to_user_id.isnot(None)
    ).scalar() or 0

    # Get list of converted user IDs
    converted_user_ids_subquery = db.query(distinct(Lead.converted_to_user_id)).filter(
        Lead.converted_to_user_id.isnot(None)
    ).all()
    converted_user_ids = [uid[0] for uid in converted_user_ids_subquery if uid[0] is not None]

    # Users who created at least 1 offer among converted leads
    if converted_user_ids:
        users_with_offers = db.query(func.count(distinct(Offer.creator_id))).filter(
            Offer.creator_id.in_(converted_user_ids)
        ).scalar() or 0
    else:
        users_with_offers = 0

    # Total users on platform with offers (for broader context if needed)
    all_users_with_offers = db.query(func.count(distinct(Offer.creator_id))).filter(
        Offer.creator_id.isnot(None)
    ).scalar() or 0

    # First sale made (offers owned by converted users or payments made by converted users)
    # First sale made by creators: payments captured on offers created by converted users
    # Or successful payments made by converted users
    if converted_user_ids:
        # Creators whose offers received a successful payment
        creator_sales = db.query(func.count(distinct(Offer.creator_id))).join(
            Payment, Payment.offer_id == Offer.id
        ).filter(
            Offer.creator_id.in_(converted_user_ids),
            Payment.status.in_([PaymentStatus.CAPTURED, PaymentStatus.SUCCEEDED])
        ).scalar() or 0
    else:
        creator_sales = 0

    # Overall platform sales count for full picture
    total_successful_sales = db.query(func.count(Payment.id)).filter(
        Payment.status.in_([PaymentStatus.CAPTURED, PaymentStatus.SUCCEEDED])
    ).scalar() or 0

    return {
        "funnel": {
            "leads_captured": total_leads,
            "unique_leads": unique_leads_count,
            "signups": converted_leads_count,
            "offers_created": users_with_offers,
            "first_sales": creator_sales,
        },
        "platform_totals": {
            "all_users_with_offers": all_users_with_offers,
            "total_successful_sales": total_successful_sales,
        },
        "conversion_rates": {
            "lead_to_signup_pct": round((converted_leads_count / unique_leads_count * 100), 1) if unique_leads_count > 0 else 0,
            "signup_to_offer_pct": round((users_with_offers / converted_leads_count * 100), 1) if converted_leads_count > 0 else 0,
            "offer_to_sale_pct": round((creator_sales / users_with_offers * 100), 1) if users_with_offers > 0 else 0,
        }
    }


@router.get("")
async def list_leads(
    source: Optional[str] = Query(None),
    converted: Optional[bool] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    List leads with optional filtering (Admin only).
    Filters: source, date range, converted/not-converted
    """
    query = db.query(Lead, User).outerjoin(User, Lead.converted_to_user_id == User.id)

    if source:
        query = query.filter(Lead.source == source)

    if converted is not None:
        if converted:
            query = query.filter(Lead.converted_to_user_id.isnot(None))
        else:
            query = query.filter(Lead.converted_to_user_id.is_(None))

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            query = query.filter(Lead.created_at >= start_dt)
        except Exception:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            query = query.filter(Lead.created_at <= end_dt)
        except Exception:
            pass

    results = query.order_by(Lead.created_at.desc()).all()

    leads_list = []
    for lead, user in results:
        lead_data = lead.to_dict()
        if user:
            lead_data["converted_user"] = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "username": user.username,
            }
        else:
            lead_data["converted_user"] = None
        leads_list.append(lead_data)

    # Calculate summary counts for the filtered/total view
    total_count = len(leads_list)
    converted_count = sum(1 for l in leads_list if l.get("converted_to_user_id") is not None)
    
    # Sources breakdown
    sources_breakdown: Dict[str, int] = {}
    for l in leads_list:
        src = l.get("source") or "direct/none"
        sources_breakdown[src] = sources_breakdown.get(src, 0) + 1

    return {
        "leads": leads_list,
        "summary": {
            "total_leads": total_count,
            "converted_leads": converted_count,
            "conversion_rate_pct": round((converted_count / total_count * 100), 1) if total_count > 0 else 0,
            "sources_breakdown": sources_breakdown,
        }
    }
