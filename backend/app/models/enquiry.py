from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, JSON, Boolean
from datetime import datetime
import enum
from app.core.database import Base

class EnquiryStatus(str, enum.Enum):
    NEW = "new"
    QUALIFIED = "qualified"
    REPLIED = "replied"
    CLOSED = "closed"
    SPAM = "spam"

class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    founder_site_id = Column(Integer, ForeignKey("founder_sites.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Lead Contact Information
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    business = Column(String(255), nullable=True)
    source = Column(String(100), nullable=True, default="website_form")
    
    # Enquiry content & structured metadata
    message = Column(Text, nullable=False)
    extra_data = Column(JSON, nullable=True) # e.g. budget, timeline, sessionType, location
    
    status = Column(SQLEnum(EnquiryStatus), default=EnquiryStatus.NEW, index=True)
    
    # AI Qualification and Draft
    ai_qualification = Column(Text, nullable=True) # AI analysis/summary of the lead
    ai_matched_offer = Column(String(255), nullable=True) # Which offer matches best
    ai_draft_reply = Column(Text, nullable=True) # AI-generated tailored response
    
    # Approval & Sending Status
    approved_by_founder = Column(Boolean, default=False)
    reply_sent_at = Column(DateTime, nullable=True)
    sent_reply_content = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "founder_site_id": self.founder_site_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "business": self.business,
            "source": self.source,
            "message": self.message,
            "extra_data": self.extra_data,
            "status": self.status.value if hasattr(self.status, 'value') else self.status,
            "ai_qualification": self.ai_qualification,
            "ai_matched_offer": self.ai_matched_offer,
            "ai_draft_reply": self.ai_draft_reply,
            "approved_by_founder": self.approved_by_founder,
            "reply_sent_at": self.reply_sent_at.isoformat() if self.reply_sent_at else None,
            "sent_reply_content": self.sent_reply_content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
