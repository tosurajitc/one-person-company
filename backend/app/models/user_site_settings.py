from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.core.database import Base


class UserSiteSettings(Base):
    """
    Stores the full site-config payload collected by the Setup Wizard,
    scoped to a single registered user (one row per user per key).

    key  — logical group name, e.g. 'general', 'brand', 'hero', 'pricing' …
    value — JSONB blob for that group (same shape as site_settings.value).
    """

    __tablename__ = "user_site_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key = Column(String(100), nullable=False, index=True)
    value = Column(JSONB, nullable=False, default={})
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<UserSiteSettings(user_id={self.user_id}, key='{self.key}')>"
