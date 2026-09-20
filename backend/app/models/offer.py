from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class OfferStatus(str, enum.Enum):
    PUBLISHED = "Published"
    DRAFT = "Draft"
    REVIEW = "Review"
    ARCHIVED = "Archived"


class OfferType(str, enum.Enum):
    COURSE = "course"
    DIGITAL_PRODUCT = "digital_product"
    COACHING = "coaching"
    SERVICE = "service"
    COMMUNITY = "community"
    VIDEO = "video"
    AUDIO = "audio"
    BOOK = "book"
    EVENT = "event"
    PHYSICAL = "physical"
    BUNDLE = "bundle"
    OTHER = "other"


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=True, index=True)          # URL-friendly identifier
    instructor = Column(String(255), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    category = Column(String(100), nullable=True)
    status = Column(SAEnum(OfferStatus), default=OfferStatus.DRAFT, nullable=False)
    offer_type = Column(SAEnum(OfferType), default=OfferType.COURSE, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=True)                  # None = free
    currency = Column(String(3), default="INR", nullable=False)    # ISO 4217
    duration = Column(String(50), nullable=True)                   # e.g. "12 hours"
    lessons_count = Column(Integer, default=0, nullable=False)
    thumbnail_url = Column(String(500), nullable=True)

    # --- Added by Migration 11, for the setup wizard's pricing ladder ---
    tier = Column(String(50), nullable=True)                       # "front_door" | "core" | "recurring"
    price_usd = Column(Numeric(10, 2), nullable=True)               # USD price, kept alongside price/currency
    deliverables = Column(JSONB, nullable=True)                     # list of strings, e.g. ["Item one", "Item two"]
    is_highlighted = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    founder_site_id = Column(
        Integer,
        ForeignKey("founder_sites.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Offer(id={self.id}, title='{self.title}', status='{self.status}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "instructor": self.instructor,
            "creator_id": self.creator_id,
            "category": self.category,
            "status": self.status.value if self.status else None,
            "offer_type": self.offer_type.value if self.offer_type else None,
            "description": self.description,
            "price": float(self.price) if self.price is not None else None,
            "currency": self.currency,
            "duration": self.duration,
            "lessons_count": self.lessons_count,
            "thumbnail_url": self.thumbnail_url,
            "tier": self.tier,
            "price_usd": float(self.price_usd) if self.price_usd is not None else None,
            "deliverables": self.deliverables,
            "is_highlighted": self.is_highlighted,
            "sort_order": self.sort_order,
            "founder_site_id": self.founder_site_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }