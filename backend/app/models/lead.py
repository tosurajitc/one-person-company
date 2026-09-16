from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    source = Column(String(100), nullable=True)       # e.g. "marketing_hero", "playbook_download"
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    utm_content = Column(String(100), nullable=True)
    referrer_url = Column(String(500), nullable=True)
    converted_to_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # set when the lead later signs up
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "source": self.source,
            "utm_source": self.utm_source,
            "utm_medium": self.utm_medium,
            "utm_campaign": self.utm_campaign,
            "utm_content": self.utm_content,
            "referrer_url": self.referrer_url,
            "converted_to_user_id": self.converted_to_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
