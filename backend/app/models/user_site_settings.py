from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy import text
from app.core.database import Base


class UserSiteSettings(Base):
    """
    Stores the full site-config payload collected by the Setup Wizard,
    scoped to a single registered user (one row per user per key).

    key           — logical group name, e.g. 'general', 'brand', 'template' …
    value         — JSONB blob for that group (same shape as site_settings.value).
    template_slug — denormalised copy of value['slug'] when key == 'template',
                    kept for fast backend queries without parsing the JSONB.
    template_section — denormalised copy of value['sectionId'] when key == 'template'.
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
    schema_version = Column(String(10), nullable=False, server_default=text("'1.0'"))
    # Denormalised template identity — only populated when key == 'template'
    template_slug    = Column(String(100), nullable=True)
    template_section = Column(String(100), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index('ix_user_site_settings_template_slug', 'user_id', 'template_slug'),
    )

    def __repr__(self):
        return f"<UserSiteSettings(user_id={self.user_id}, key='{self.key}')>"
