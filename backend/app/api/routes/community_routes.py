"""
Community API Routes — tenant-scoped (per-founder).

Route groups
────────────
Founder self-serve (auth required):
  POST   /api/communities                         — create community + backing Offer atomically
  GET    /api/communities/mine                    — list caller's communities
  PUT    /api/communities/{id}                    — update name / description / branding / status
  GET    /api/communities/{id}/settings           — get CommunitySettings
  PUT    /api/communities/{id}/settings           — update categories / rules / feature flags

Public (no auth):
  GET    /api/public/{username}/community/{slug}  — community landing page

Join (auth required):
  POST   /api/public/{username}/community/{slug}/join  — free join or redirect to payment

Member-only (membership-gated):
  GET    /api/community/{community_id}/threads
  POST   /api/community/{community_id}/threads
  GET    /api/community/{community_id}/threads/{thread_id}
  POST   /api/community/{community_id}/threads/{thread_id}/posts

  GET    /api/community/{community_id}/events

Owner-only:
  POST   /api/community/{community_id}/events
  GET    /api/community/{community_id}/members
  PUT    /api/community/{community_id}/members/{member_id}
  DELETE /api/community/{community_id}/members/{member_id}

Platform admin:
  GET    /api/admin/communities                   — oversight list
  GET    /api/admin/community-templates           — template library
  POST   /api/admin/community-templates
  PUT    /api/admin/community-templates/{id}
  DELETE /api/admin/community-templates/{id}
"""

from __future__ import annotations

import re
import logging
from typing import List, Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_user_optional,
    get_current_admin_user,
)
from app.models.user import User, UserRole
from app.models.offer import Offer, OfferType, OfferStatus
from app.models.subscription import UserSubscription, PlanTier, Payment, PaymentStatus
from app.models.community import (
    Community, CommunityStatus,
    CommunitySettings, CommunityThread, CommunityPost,
    CommunityMember, CommunityEvent, CommunityTemplate,
    ThreadStatus, MemberRole, EventType, EventStatus,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["community"])


# ===========================================================================
# Utilities
# ===========================================================================

def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text[:80]


def _require_pro_or_enterprise(user: User, db: Session) -> None:
    """Raise 403 if user is not on Pro or Enterprise plan."""
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
    if sub is None or sub.plan == PlanTier.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Community creation requires a Pro or Enterprise plan. Upgrade at /pricing.",
        )


def _get_community_or_404(community_id: int, db: Session) -> Community:
    c = db.query(Community).filter(Community.id == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    return c


def _require_owner(community: Community, user: User) -> None:
    if community.owner_id != user.id and not user.is_admin():
        raise HTTPException(status_code=403, detail="Not the community owner")


def _require_member(community_id: int, user: User, db: Session) -> CommunityMember:
    """Return the member row, or raise 403 if user is not a member."""
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this community.",
        )
    if member.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You have been banned from this community.",
        )
    return member


def _enrich_community(c: Community, db: Session) -> dict:
    """Add member_count and offer price to community dict."""
    d = c.to_dict()
    d["member_count"] = db.query(CommunityMember).filter(
        CommunityMember.community_id == c.id, CommunityMember.is_active == True
    ).count()
    offer = db.query(Offer).filter(Offer.id == c.offer_id).first()
    if offer:
        d["price"] = float(offer.price) if offer.price is not None else None
        d["currency"] = offer.currency
    return d


# ===========================================================================
# Pydantic schemas
# ===========================================================================

class CommunityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None          # None / 0 = free
    currency: str = "INR"
    category_template: Optional[str] = None
    branding: Optional[Dict[str, Any]] = None


class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CommunityStatus] = None
    branding: Optional[Dict[str, Any]] = None


class CommunitySettingsUpdate(BaseModel):
    welcome_message: Optional[str] = None
    rules: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    features_enabled: Optional[Dict[str, Any]] = None


class ThreadCreate(BaseModel):
    title: str
    body: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = []
    is_featured: bool = False


class ThreadUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[ThreadStatus] = None
    is_featured: Optional[bool] = None


class PostCreate(BaseModel):
    body: str


class MemberUpdate(BaseModel):
    role: Optional[MemberRole] = None
    is_active: Optional[bool] = None
    is_banned: Optional[bool] = None
    badges: Optional[List[str]] = None


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType = EventType.WEBINAR
    status: EventStatus = EventStatus.UPCOMING
    host_name: Optional[str] = None
    meeting_url: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: int = 60
    max_participants: Optional[int] = None
    tags: Optional[List[str]] = []
    thumbnail_url: Optional[str] = None
    is_featured: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    host_name: Optional[str] = None
    meeting_url: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    max_participants: Optional[int] = None
    tags: Optional[List[str]] = None
    thumbnail_url: Optional[str] = None
    is_featured: Optional[bool] = None


class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    categories: List[str]
    feature_flags: Optional[Dict[str, Any]] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    categories: Optional[List[str]] = None
    feature_flags: Optional[Dict[str, Any]] = None


# ===========================================================================
# Founder self-serve — /api/communities
# ===========================================================================

@router.post("/communities", status_code=status.HTTP_201_CREATED)
async def create_community(
    payload: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a community.  Gated to Pro/Enterprise.
    Creates the backing Offer atomically in the same transaction."""
    _require_pro_or_enterprise(current_user, db)

    slug = _slugify(payload.name)
    # Ensure slug uniqueness per owner
    existing = db.query(Community).filter(
        Community.owner_id == current_user.id,
        Community.slug == slug,
    ).first()
    if existing:
        slug = f"{slug}-{current_user.id}"

    # Seed categories from template if chosen
    seed_categories: List[str] = []
    seed_flags: Dict[str, Any] = {"threads": True, "events": True, "members": True}
    if payload.category_template:
        tmpl = db.query(CommunityTemplate).filter(
            CommunityTemplate.name == payload.category_template
        ).first()
        if tmpl:
            seed_categories = tmpl.categories or []
            seed_flags = tmpl.feature_flags or seed_flags

    instructor_name = current_user.full_name or current_user.email
    offer = Offer(
        title=payload.name,
        slug=slug,
        instructor=instructor_name,
        creator_id=current_user.id,
        status=OfferStatus.PUBLISHED,
        offer_type=OfferType.COMMUNITY,
        description=payload.description,
        price=payload.price if payload.price and payload.price > 0 else None,
        currency=payload.currency,
    )
    db.add(offer)
    db.flush()  # get offer.id before community insert

    community = Community(
        owner_id=current_user.id,
        offer_id=offer.id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        category_template=payload.category_template,
        status=CommunityStatus.DRAFT,
        branding=payload.branding,
    )
    db.add(community)
    db.flush()  # get community.id

    settings = CommunitySettings(
        community_id=community.id,
        welcome_message=f"Welcome to {payload.name}!",
        rules=[],
        categories=seed_categories,
        features_enabled=seed_flags,
    )
    db.add(settings)

    # Owner auto-joins as admin member
    member = CommunityMember(
        community_id=community.id,
        user_id=current_user.id,
        role=MemberRole.ADMIN,
        display_name=current_user.full_name,
    )
    db.add(member)

    try:
        db.commit()
        db.refresh(community)
    except Exception as e:
        db.rollback()
        logger.error("create_community error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

    return _enrich_community(community, db)


@router.get("/communities/mine")
async def list_my_communities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    communities = db.query(Community).filter(
        Community.owner_id == current_user.id
    ).order_by(Community.created_at.desc()).all()
    return [_enrich_community(c, db) for c in communities]


@router.put("/communities/{community_id}")
async def update_community(
    community_id: int,
    payload: CommunityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(community, field, value)

    # If name changed, sync offer title
    if payload.name:
        offer = db.query(Offer).filter(Offer.id == community.offer_id).first()
        if offer:
            offer.title = payload.name
            db.add(offer)

    try:
        db.commit()
        db.refresh(community)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return _enrich_community(community, db)


@router.get("/communities/{community_id}/settings")
async def get_community_settings(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)
    s = db.query(CommunitySettings).filter(
        CommunitySettings.community_id == community_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Settings not found")
    return s.to_dict()


@router.put("/communities/{community_id}/settings")
async def update_community_settings(
    community_id: int,
    payload: CommunitySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)
    s = db.query(CommunitySettings).filter(
        CommunitySettings.community_id == community_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Settings not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    try:
        db.commit()
        db.refresh(s)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return s.to_dict()


# ===========================================================================
# Public routes — /api/public/{username}/community/{slug}
# ===========================================================================

@router.get("/public/{username}/community/{slug}")
async def community_landing(
    username: str,
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Public landing page data — no auth required."""
    owner = db.query(User).filter(User.username == username).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Founder not found")

    community = db.query(Community).filter(
        Community.owner_id == owner.id,
        Community.slug == slug,
        Community.status == CommunityStatus.ACTIVE,
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    offer = db.query(Offer).filter(Offer.id == community.offer_id).first()
    settings = db.query(CommunitySettings).filter(
        CommunitySettings.community_id == community.id
    ).first()

    is_member = False
    if current_user:
        is_member = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id == current_user.id,
            CommunityMember.is_banned == False,
        ).first() is not None

    return {
        "id": community.id,
        "name": community.name,
        "slug": community.slug,
        "description": community.description,
        "branding": community.branding or {},
        "price": float(offer.price) if offer and offer.price else None,
        "currency": offer.currency if offer else "INR",
        "offer_id": community.offer_id,
        "member_count": db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.is_active == True,
        ).count(),
        "categories": settings.categories if settings else [],
        "welcome_message": settings.welcome_message if settings else None,
        "features_enabled": settings.features_enabled if settings else {},
        "owner": {
            "username": owner.username,
            "full_name": owner.full_name,
            "avatar_url": owner.avatar_url,
        },
        "is_member": is_member,
    }


@router.post("/public/{username}/community/{slug}/join", status_code=status.HTTP_201_CREATED)
async def join_community(
    username: str,
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a community.
    - Free community → create CommunityMember immediately.
    - Paid community → return offer_id so the client initiates /api/payments/create-order.
    """
    owner = db.query(User).filter(User.username == username).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Founder not found")

    community = db.query(Community).filter(
        Community.owner_id == owner.id,
        Community.slug == slug,
        Community.status == CommunityStatus.ACTIVE,
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Already a member?
    existing = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == current_user.id,
    ).first()
    if existing:
        if existing.is_banned:
            raise HTTPException(status_code=403, detail="You are banned from this community")
        return {"status": "already_member", "community_id": community.id}

    offer = db.query(Offer).filter(Offer.id == community.offer_id).first()
    is_free = offer is None or offer.price is None or float(offer.price) == 0

    if is_free:
        member = CommunityMember(
            community_id=community.id,
            user_id=current_user.id,
            role=MemberRole.MEMBER,
            display_name=current_user.full_name,
        )
        db.add(member)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        return {"status": "joined", "community_id": community.id}
    else:
        # Caller must proceed through the existing payment flow
        return {
            "status": "payment_required",
            "offer_id": community.offer_id,
            "community_id": community.id,
            "amount": float(offer.price),
            "currency": offer.currency,
        }


# ===========================================================================
# Member-only — /api/community/{community_id}/...
# ===========================================================================

@router.get("/community/{community_id}/threads")
async def list_threads(
    community_id: int,
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_community_or_404(community_id, db)
    _require_member(community_id, current_user, db)

    q = db.query(CommunityThread).filter(CommunityThread.community_id == community_id)
    if category:
        q = q.filter(CommunityThread.category == category)
    if featured is not None:
        q = q.filter(CommunityThread.is_featured == featured)
    threads = q.order_by(CommunityThread.created_at.desc()).all()
    return [t.to_dict() for t in threads]


@router.post("/community/{community_id}/threads", status_code=status.HTTP_201_CREATED)
async def create_thread(
    community_id: int,
    payload: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_community_or_404(community_id, db)
    _require_member(community_id, current_user, db)

    thread = CommunityThread(
        community_id=community_id,
        author_id=current_user.id,
        author_name=current_user.full_name or current_user.email,
        **payload.model_dump(),
    )
    db.add(thread)
    try:
        db.commit()
        db.refresh(thread)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return thread.to_dict()


@router.get("/community/{community_id}/threads/{thread_id}")
async def get_thread(
    community_id: int,
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_community_or_404(community_id, db)
    _require_member(community_id, current_user, db)

    thread = db.query(CommunityThread).filter(
        CommunityThread.id == thread_id,
        CommunityThread.community_id == community_id,
    ).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Increment view count
    thread.view_count = (thread.view_count or 0) + 1
    db.commit()

    posts = db.query(CommunityPost).filter(
        CommunityPost.thread_id == thread_id,
        CommunityPost.is_hidden == False,
    ).order_by(CommunityPost.created_at).all()
    return {**thread.to_dict(), "posts": [p.to_dict() for p in posts]}


@router.put("/community/{community_id}/threads/{thread_id}")
async def update_thread(
    community_id: int,
    thread_id: int,
    payload: ThreadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_member(community_id, current_user, db)

    thread = db.query(CommunityThread).filter(
        CommunityThread.id == thread_id,
        CommunityThread.community_id == community_id,
    ).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Only the author or owner can edit
    if thread.author_id != current_user.id and community.owner_id != current_user.id and not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not the thread author")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(thread, field, value)
    try:
        db.commit()
        db.refresh(thread)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return thread.to_dict()


@router.delete("/community/{community_id}/threads/{thread_id}")
async def delete_thread(
    community_id: int,
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    thread = db.query(CommunityThread).filter(
        CommunityThread.id == thread_id,
        CommunityThread.community_id == community_id,
    ).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread.author_id != current_user.id and community.owner_id != current_user.id and not current_user.is_admin():
        raise HTTPException(status_code=403, detail="Not the thread author")
    db.delete(thread)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True}


@router.post("/community/{community_id}/threads/{thread_id}/posts", status_code=status.HTTP_201_CREATED)
async def create_post(
    community_id: int,
    thread_id: int,
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_community_or_404(community_id, db)
    _require_member(community_id, current_user, db)

    thread = db.query(CommunityThread).filter(
        CommunityThread.id == thread_id,
        CommunityThread.community_id == community_id,
    ).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread.status == ThreadStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Thread is closed")

    post = CommunityPost(
        thread_id=thread_id,
        body=payload.body,
        author_id=current_user.id,
        author_name=current_user.full_name or current_user.email,
    )
    db.add(post)
    thread.reply_count = (thread.reply_count or 0) + 1
    try:
        db.commit()
        db.refresh(post)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return post.to_dict()


@router.get("/community/{community_id}/events")
async def list_events(
    community_id: int,
    event_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_community_or_404(community_id, db)
    _require_member(community_id, current_user, db)

    q = db.query(CommunityEvent).filter(CommunityEvent.community_id == community_id)
    if event_status:
        q = q.filter(CommunityEvent.status == event_status)
    events = q.order_by(CommunityEvent.scheduled_at).all()
    return [e.to_dict() for e in events]


# ===========================================================================
# Owner-only — events + members
# ===========================================================================

@router.post("/community/{community_id}/events", status_code=status.HTTP_201_CREATED)
async def create_event(
    community_id: int,
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)

    event = CommunityEvent(
        community_id=community_id,
        **payload.model_dump(),
    )
    db.add(event)
    try:
        db.commit()
        db.refresh(event)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return event.to_dict()


@router.put("/community/{community_id}/events/{event_id}")
async def update_event(
    community_id: int,
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)

    event = db.query(CommunityEvent).filter(
        CommunityEvent.id == event_id,
        CommunityEvent.community_id == community_id,
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    try:
        db.commit()
        db.refresh(event)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return event.to_dict()


@router.delete("/community/{community_id}/events/{event_id}")
async def delete_event(
    community_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)

    event = db.query(CommunityEvent).filter(
        CommunityEvent.id == event_id,
        CommunityEvent.community_id == community_id,
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True}


@router.get("/community/{community_id}/members")
async def list_members(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)

    members = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id
    ).order_by(CommunityMember.joined_at.desc()).all()
    return [m.to_dict() for m in members]


@router.put("/community/{community_id}/members/{member_id}")
async def update_member(
    community_id: int,
    member_id: int,
    payload: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)

    member = db.query(CommunityMember).filter(
        CommunityMember.id == member_id,
        CommunityMember.community_id == community_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    try:
        db.commit()
        db.refresh(member)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return member.to_dict()


@router.delete("/community/{community_id}/members/{member_id}")
async def remove_member(
    community_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = _get_community_or_404(community_id, db)
    _require_owner(community, current_user)

    member = db.query(CommunityMember).filter(
        CommunityMember.id == member_id,
        CommunityMember.community_id == community_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True}


# ===========================================================================
# Platform admin — /api/admin/communities  +  /api/admin/community-templates
# ===========================================================================

@router.get("/admin/communities")
async def admin_list_communities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Platform oversight — all communities, read-only."""
    communities = db.query(Community).order_by(Community.created_at.desc()).all()
    result = []
    for c in communities:
        owner = db.query(User).filter(User.id == c.owner_id).first()
        d = _enrich_community(c, db)
        d["owner_email"] = owner.email if owner else None
        d["owner_name"] = owner.full_name if owner else None
        result.append(d)
    return result


@router.get("/admin/community-templates")
async def admin_list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    templates = db.query(CommunityTemplate).order_by(CommunityTemplate.name).all()
    return [t.to_dict() for t in templates]


@router.post("/admin/community-templates", status_code=status.HTTP_201_CREATED)
async def admin_create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    existing = db.query(CommunityTemplate).filter(CommunityTemplate.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Template name already exists")
    tmpl = CommunityTemplate(**payload.model_dump())
    db.add(tmpl)
    try:
        db.commit()
        db.refresh(tmpl)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return tmpl.to_dict()


@router.put("/admin/community-templates/{template_id}")
async def admin_update_template(
    template_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    tmpl = db.query(CommunityTemplate).filter(CommunityTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tmpl, field, value)
    try:
        db.commit()
        db.refresh(tmpl)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return tmpl.to_dict()


@router.delete("/admin/community-templates/{template_id}")
async def admin_delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    tmpl = db.query(CommunityTemplate).filter(CommunityTemplate.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(tmpl)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True}


# ===========================================================================
# Internal helper — called by payment webhook to grant membership
# ===========================================================================

def grant_community_membership_for_offer(offer_id: int, user_id: int, payment_id: int, db: Session) -> None:
    """Called from the payment webhook when offer_type == 'community'."""
    community = db.query(Community).filter(Community.offer_id == offer_id).first()
    if not community:
        return

    existing = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == user_id,
    ).first()
    if existing:
        return  # already a member (e.g. duplicate webhook delivery)

    user = db.query(User).filter(User.id == user_id).first()
    member = CommunityMember(
        community_id=community.id,
        user_id=user_id,
        joined_via_payment_id=payment_id,
        role=MemberRole.MEMBER,
        display_name=user.full_name if user else None,
    )
    db.add(member)
    # Note: caller (webhook handler) is responsible for committing
