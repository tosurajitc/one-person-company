"""
newsletter_subscriber.py — Tracks newsletter email subscriptions from the footer form.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.core.database import Base


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    # Optional name captured for personalised outreach
    name = Column(String(255), nullable=True)
    # Where on the site they subscribed (e.g. "footer", "landing_hero")
    source = Column(String(100), nullable=True, default="footer")
    # Whether they are still active (can be flipped on unsubscribe)
    is_active = Column(Boolean, default=True, nullable=False)
    subscribed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    unsubscribed_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "source": self.source,
            "is_active": self.is_active,
            "subscribed_at": self.subscribed_at.isoformat() if self.subscribed_at else None,
            "unsubscribed_at": self.unsubscribed_at.isoformat() if self.unsubscribed_at else None,
        }
