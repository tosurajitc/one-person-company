from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.core.database import Base


class Resource(Base):
    """Founder playbooks and reference guides managed from admin."""
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)   # validated against site_settings['playbook_categories']
    content_type = Column(String(50), nullable=False, default="guide")  # guide, template, checklist, download
    is_featured = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    read_time_minutes = Column(Integer, nullable=True)
    file_url = Column(String(1000), nullable=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    difficulty = Column(String(50), nullable=True)               # Beginner, Intermediate, Advanced
    duration = Column(String(100), nullable=True)                # e.g. "45 min read", "2 hours"
    author = Column(String(200), nullable=True)
    thumbnail_url = Column(String(1000), nullable=True)
    resource_url = Column(String(1000), nullable=True)           # External link or internal path
    tags = Column(JSONB, default=list)                           # ["Playbook", "Launch", ...]
    rating = Column(Float, default=0.0)
    downloads = Column(Integer, default=0)
    is_published = Column(Boolean, default=True, nullable=False)
    parent_id = Column(Integer, nullable=True, index=True)
    nav_order = Column(Integer, default=0)

    # ── Added: relevance/deep-link fields (Migration f5a6b7c8d9e0) ──────────
    # related_route: the dashboard/wizard path this playbook helps with, e.g.
    #   "/setup-wizard", "/templates". A frontend "Need help?" panel on that
    #   page matches its own path against this field (suffix match) to surface
    #   the right playbook inline. NULL = not tied to a specific page.
    related_route = Column(String(255), nullable=True, index=False)

    # unlocks_after_phase: NULL = show to everyone regardless of progress.
    # An integer means "only show once the founder has reached this phase",
    # using the same phase numbering as GET /api/my-site/status
    # (0=no site, 1=site built, 2=theme selected, 3=site live,
    #  4=sales desk in use, 5=ad management started). Prevents pushing e.g.
    # ad-campaign playbooks at someone whose site isn't live yet.
    unlocks_after_phase = Column(Integer, nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "content_type": self.content_type,
            "type": self.content_type,
            "is_featured": self.is_featured,
            "featured": self.is_featured,
            "is_public": self.is_public,
            "read_time_minutes": self.read_time_minutes,
            "file_url": self.file_url,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "difficulty": self.difficulty,
            "duration": self.duration,
            "author": self.author,
            "thumbnail_url": self.thumbnail_url,
            "resource_url": self.resource_url,
            "tags": self.tags or [],
            "rating": self.rating,
            "downloads": self.downloads,
            "is_published": self.is_published,
            "parent_id": self.parent_id,
            "nav_order": self.nav_order,
            "related_route": self.related_route,
            "unlocks_after_phase": self.unlocks_after_phase,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }