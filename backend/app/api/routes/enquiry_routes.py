"""
enquiry_routes.py

Handles enquiry capture from founder templates and AI Sales Desk
lead review, editing, and approval workflows.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import AuthService
from app.models.user import User
from app.models.founder_site import FounderSite
from app.models.enquiry import Enquiry, EnquiryStatus
from app.services.sales_desk_service import qualify_and_draft_reply

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class EnquirySubmitRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    name: str
    email: EmailStr
    phone: Optional[str] = None
    business: Optional[str] = None
    subdomain: Optional[str] = None
    username: Optional[str] = None
    message: Optional[str] = ""
    source: Optional[str] = "website_form"


class EnquiryUpdateRequest(BaseModel):
    status: Optional[str] = None
    ai_draft_reply: Optional[str] = None


class RegenerateDraftRequest(BaseModel):
    instructions: Optional[str] = None


class ApproveAndSendRequest(BaseModel):
    reply_content: str


# ---------------------------------------------------------------------------
# Public Endpoint: Submit an Enquiry
# ---------------------------------------------------------------------------

@router.post("/submit")
def submit_enquiry(req: EnquirySubmitRequest, db: Session = Depends(get_db)):
    """
    Public endpoint: captures an enquiry submitted on a founder's website.
    Resolves the target founder by subdomain or username.
    Automatically generates initial AI qualification and grounded reply draft.
    """
    if not req.name or not req.email:
        raise HTTPException(status_code=400, detail="Name and email are required.")

    # 1. Resolve target founder user
    founder_site = None
    user_id = None

    lookup_slug = (req.subdomain or req.username or "").strip().lower()
    if lookup_slug:
        founder_site = db.query(FounderSite).filter(FounderSite.slug == lookup_slug).first()
        if founder_site:
            user_id = founder_site.user_id
        else:
            user = db.query(User).filter(User.username == lookup_slug).first()
            if user:
                user_id = user.id

    # If not resolved by slug, try by email or take first site if solo instance
    if not user_id:
        first_site = db.query(FounderSite).first()
        if first_site:
            user_id = first_site.user_id
            founder_site = first_site

    # Extra fields collection
    extra = {}
    for k, v in req.model_dump().items():
        if k not in ["name", "email", "phone", "business", "message", "source", "subdomain", "username"]:
            extra[k] = v

    enquiry = Enquiry(
        user_id=user_id,
        founder_site_id=founder_site.id if founder_site else None,
        name=req.name.strip(),
        email=req.email.strip().lower(),
        phone=req.phone,
        business=req.business,
        source=req.source or "website_form",
        message=req.message or "Inquiry submitted via website form.",
        extra_data=extra if extra else None,
        status=EnquiryStatus.NEW,
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    # Trigger AI Qualification & Reply Draft
    if user_id:
        try:
            qual, offer, draft = qualify_and_draft_reply(db, enquiry)
            enquiry.ai_qualification = qual
            enquiry.ai_matched_offer = offer
            enquiry.ai_draft_reply = draft
            db.commit()
            db.refresh(enquiry)
        except Exception as e:
            logger.error(f"Error generating AI draft for enquiry #{enquiry.id}: {e}")

    return {
        "success": True,
        "message": "Enquiry received successfully",
        "enquiry_id": enquiry.id,
    }


# ---------------------------------------------------------------------------
# Founder Authenticated Endpoints: AI Sales Desk
# ---------------------------------------------------------------------------

def _get_current_user(request: Request, db: Session) -> User:
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
    if not token:
        token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = AuthService.get_user_from_token(token, db)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user


@router.get("/mine")
def get_my_enquiries(
    request: Request,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Returns all enquiries received for the logged-in founder's site.
    """
    user = _get_current_user(request, db)
    query = db.query(Enquiry).filter(Enquiry.user_id == user.id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Enquiry.status == status_filter.lower())

    enquiries = query.order_by(Enquiry.created_at.desc()).all()
    return {
        "enquiries": [e.to_dict() for e in enquiries],
        "total": len(enquiries),
    }


@router.patch("/{enquiry_id}")
def update_enquiry(
    enquiry_id: int,
    req: EnquiryUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Update status or custom draft response for an enquiry.
    """
    user = _get_current_user(request, db)
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id, Enquiry.user_id == user.id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    if req.status:
        enquiry.status = req.status
    if req.ai_draft_reply is not None:
        enquiry.ai_draft_reply = req.ai_draft_reply

    db.commit()
    db.refresh(enquiry)
    return {"success": True, "enquiry": enquiry.to_dict()}


@router.post("/{enquiry_id}/regenerate-draft")
def regenerate_draft(
    enquiry_id: int,
    req: RegenerateDraftRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Re-runs the AI Sales Desk agent to produce a fresh tailored draft.
    """
    user = _get_current_user(request, db)
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id, Enquiry.user_id == user.id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    qual, offer, draft = qualify_and_draft_reply(db, enquiry, custom_instructions=req.instructions)
    enquiry.ai_qualification = qual
    enquiry.ai_matched_offer = offer
    enquiry.ai_draft_reply = draft
    db.commit()
    db.refresh(enquiry)

    return {"success": True, "enquiry": enquiry.to_dict()}


@router.post("/{enquiry_id}/approve-and-send")
def approve_and_send_reply(
    enquiry_id: int,
    req: ApproveAndSendRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Founder approves the validated email draft and sends it to the lead.
    """
    user = _get_current_user(request, db)
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id, Enquiry.user_id == user.id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    reply_text = req.reply_content.strip()
    if not reply_text:
        raise HTTPException(status_code=400, detail="Reply content cannot be empty")

    # Mark as approved and sent
    enquiry.approved_by_founder = True
    enquiry.reply_sent_at = datetime.utcnow()
    enquiry.sent_reply_content = reply_text
    enquiry.status = EnquiryStatus.REPLIED

    db.commit()
    db.refresh(enquiry)

    logger.info(f"Reply sent to lead {enquiry.email} for enquiry #{enquiry.id} by founder #{user.id}")

    return {
        "success": True,
        "message": f"Reply approved and sent to {enquiry.email}",
        "enquiry": enquiry.to_dict(),
    }
