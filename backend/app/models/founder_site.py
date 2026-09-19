"""
FounderSite -- one row per founder's public website.
FounderSiteSlugHistory -- every slug a site used to have, for 301 redirects
                          and to stop anyone else claiming an old address.

These match the tables created by Migration 10
(alembic/versions/c4d5e6f7a8b9_add_founder_sites_table.py). If you ever
change a column here, it must be a new additive migration too -- this file
alone does not touch the database.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.core.database import Base


class FounderSite(Base):
    __tablename__ = "founder_sites"

    id = Column(Integer, primary_key=True, index=True)

    # One site per user. CASCADE means if a user is ever deleted, their
    # site row goes with them (same rule the migration set at the DB level).
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # The public address, e.g. "jane-doe-studio" -> /jane-doe-studio
    slug = Column(String(100), nullable=False, unique=True, index=True)

    # One of: "professional", "warm", "bold", "local" (Phase 4 theme set).
    # Kept as a plain string, not an enum, so new themes can be added later
    # without another migration.
    theme = Column(String(50), nullable=False, default="professional")

    # One of: "draft", "published". Kept as a plain string for the same
    # reason -- status values may grow (e.g. "unpublished") without a
    # schema change.
    status = Column(String(20), nullable=False, default="draft")

    custom_domain = Column(String(255), nullable=True, unique=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<FounderSite(id={self.id}, user_id={self.user_id}, slug='{self.slug}')>"

    def is_published(self) -> bool:
        return self.status == "published"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "slug": self.slug,
            "theme": self.theme,
            "status": self.status,
            "custom_domain": self.custom_domain,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class FounderSiteSlugHistory(Base):
    __tablename__ = "founder_site_slug_history"

    id = Column(Integer, primary_key=True, index=True)

    founder_site_id = Column(
        Integer,
        ForeignKey("founder_sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # A slug can only ever have belonged to one site, past or present --
    # this is what lets reserved_names.py safely say "taken" for an old
    # slug even if the site that used it has since changed its address.
    old_slug = Column(String(100), nullable=False, unique=True, index=True)

    replaced_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<FounderSiteSlugHistory(founder_site_id={self.founder_site_id}, old_slug='{self.old_slug}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "founder_site_id": self.founder_site_id,
            "old_slug": self.old_slug,
            "replaced_at": self.replaced_at.isoformat() if self.replaced_at else None,
        }