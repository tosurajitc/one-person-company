"""
subscriber_routes.py — Newsletter subscriber API routes.

POST /api/subscribers          Public   Subscribe an email to the newsletter.
GET  /api/subscribers          Admin    List all subscribers with filtering.
PATCH /api/subscribers/{id}    Admin    Toggle active status (unsubscribe/resubscribe).
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.newsletter_subscriber import NewsletterSubscriber

router = APIRouter(prefix="/subscribers", tags=["subscribers"])


class SubscribeRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    source: Optional[str] = "footer"


@router.post("", status_code=status.HTTP_200_OK)
async def subscribe(
    payload: SubscribeRequest,
    db: Session = Depends(get_db),
):
    """
    Subscribe an email to the newsletter (Public).
    Idempotent — re-subscribes a previously unsubscribed email.
    """
    normalized_email = payload.email.strip().lower()

    existing = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.email == normalized_email
    ).first()

    if existing:
        if not existing.is_active:
            # Re-subscribe
            existing.is_active = True
            existing.unsubscribed_at = None
            existing.subscribed_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
        return {"success": True, "message": "Successfully subscribed!", "subscriber": existing.to_dict()}

    new_sub = NewsletterSubscriber(
        email=normalized_email,
        name=payload.name.strip() if payload.name else None,
        source=payload.source or "footer",
        is_active=True,
        subscribed_at=datetime.utcnow(),
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return {"success": True, "message": "Successfully subscribed!", "subscriber": new_sub.to_dict()}


@router.get("")
async def list_subscribers(
    active_only: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by email or name"),
    source: Optional[str] = Query(None, description="Filter by source"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    List newsletter subscribers (Admin only).
    """
    query = db.query(NewsletterSubscriber)

    if active_only is not None:
        query = query.filter(NewsletterSubscriber.is_active == active_only)

    if source:
        query = query.filter(NewsletterSubscriber.source == source)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            func.lower(NewsletterSubscriber.email).like(search_term) |
            func.lower(NewsletterSubscriber.name).like(search_term)
        )

    subscribers = query.order_by(NewsletterSubscriber.subscribed_at.desc()).all()

    total = len(subscribers)
    active_count = sum(1 for s in subscribers if s.is_active)

    return {
        "subscribers": [s.to_dict() for s in subscribers],
        "summary": {
            "total": total,
            "active": active_count,
            "unsubscribed": total - active_count,
        }
    }


@router.patch("/{subscriber_id}")
async def toggle_subscriber_status(
    subscriber_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Toggle active/inactive status for a subscriber (Admin only).
    """
    sub = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.id == subscriber_id).first()
    if not sub:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Subscriber not found")

    sub.is_active = not sub.is_active
    if not sub.is_active:
        sub.unsubscribed_at = datetime.utcnow()
    else:
        sub.unsubscribed_at = None

    db.commit()
    db.refresh(sub)
    return {"success": True, "subscriber": sub.to_dict()}
