"""
Content Management API Routes
GET    /api/content/offers       — list all offers (admin)
POST   /api/content/offers       — create an offer (admin)
GET    /api/content/offers/:id   — get a single offer (admin)
PUT    /api/content/offers/:id   — update an offer (admin)
DELETE /api/content/offers/:id   — delete an offer (admin)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.offer import Offer, OfferStatus, OfferType

router = APIRouter(prefix="/content", tags=["content"])


# ---------------------------------------------------------------------------
# Pydantic schemas (inline — no separate schemas file needed)
# ---------------------------------------------------------------------------

class OfferCreate(BaseModel):
    title: str
    instructor: str
    slug: Optional[str] = None
    category: Optional[str] = None
    status: OfferStatus = OfferStatus.DRAFT
    offer_type: OfferType = OfferType.COURSE
    description: Optional[str] = None
    price: Optional[float] = None
    currency: str = "INR"
    duration: Optional[str] = None
    lessons_count: int = 0
    thumbnail_url: Optional[str] = None


class OfferUpdate(BaseModel):
    title: Optional[str] = None
    instructor: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    status: Optional[OfferStatus] = None
    offer_type: Optional[OfferType] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    duration: Optional[str] = None
    lessons_count: Optional[int] = None
    thumbnail_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/offers")
async def list_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Return all offers ordered by creation date desc."""
    offers = db.query(Offer).order_by(Offer.created_at.desc()).all()
    return [o.to_dict() for o in offers]


@router.post("/offers", status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Create a new offer."""
    import re
    auto_slug = payload.slug or re.sub(r"[^\w\s-]", "", payload.title.lower())
    auto_slug = re.sub(r"[\s_-]+", "-", auto_slug).strip("-")
    offer = Offer(
        title=payload.title,
        slug=auto_slug,
        instructor=payload.instructor,
        creator_id=current_user.id,
        category=payload.category,
        status=payload.status,
        offer_type=payload.offer_type,
        description=payload.description,
        price=payload.price,
        currency=payload.currency,
        duration=payload.duration,
        lessons_count=payload.lessons_count,
        thumbnail_url=payload.thumbnail_url,
    )
    db.add(offer)
    try:
        db.commit()
        db.refresh(offer)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create offer: {str(e)}",
        )
    return offer.to_dict()


@router.get("/offers/{offer_id}")
async def get_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get a single offer by ID."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return offer.to_dict()


@router.put("/offers/{offer_id}")
async def update_offer(
    offer_id: int,
    payload: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Update an existing offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(offer, field, value)

    try:
        db.commit()
        db.refresh(offer)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update offer: {str(e)}",
        )
    return offer.to_dict()


@router.delete("/offers/{offer_id}")
async def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    db.delete(offer)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete offer: {str(e)}",
        )
    return {"success": True, "message": "Offer deleted successfully."}


# ---------------------------------------------------------------------------
# Public endpoint: GET /api/offers/public/{username}/{slug}
# ---------------------------------------------------------------------------

@router.get("/offers/public/{username}/{slug}")
async def get_public_offer(
    username: str,
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Return a published offer by creator username + slug.
    No authentication required — used by the public offer landing page.
    """
    from app.models.user import User as UserModel
    creator = db.query(UserModel).filter(UserModel.username == username).first()
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Founder not found")

    offer = db.query(Offer).filter(
        Offer.creator_id == creator.id,
        Offer.slug == slug,
        Offer.status == OfferStatus.PUBLISHED,
    ).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found or not published")

    return {
        **offer.to_dict(),
        "creator": {
            "id": creator.id,
            "username": creator.username,
            "full_name": creator.full_name,
            "avatar_url": creator.avatar_url,
        },
    }
