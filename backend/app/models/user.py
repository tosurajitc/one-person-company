from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Numeric
from sqlalchemy.sql import func
import enum
import uuid
from datetime import datetime

from app.core.database import Base

def _generate_referral_code() -> str:
    """Generate a short, unique referral code like REF-A1B2C3D4."""
    return "REF-" + uuid.uuid4().hex[:8].upper()

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class OAuthProvider(str, enum.Enum):
    GOOGLE = "google"
    FACEBOOK = "facebook"
    GITHUB = "github"
    LINKEDIN = "linkedin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)   # URL-safe handle, e.g. "jane-doe"
    avatar_url = Column(String(500), nullable=True)
    
    # Role management
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    
    # Password (for local admin account; NULL for OAuth-only users)
    password_hash = Column(String(255), nullable=True)

    # OAuth tracking
    oauth_provider = Column(Enum(OAuthProvider), nullable=True)
    oauth_id = Column(String(255), nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Additional fields for user management
    last_login = Column(DateTime(timezone=True), nullable=True)
    email_verified = Column(Boolean, default=True, nullable=False)  # OAuth emails are pre-verified

    # AI Website Builder token/generation tracking
    ai_generations_count = Column(Integer, default=0, nullable=False)
    ai_generation_credits = Column(Integer, default=0, nullable=False)
    ai_tokens_used = Column(Integer, default=0, nullable=False)
    # Tokens consumed specifically by /api/genie/refine-answer calls
    ai_refine_tokens_used = Column(Integer, default=0, nullable=False)

    # User Wallet
    wallet_balance = Column(Numeric(10, 2), default=0.0, nullable=False)
    wallet_consumed = Column(Numeric(10, 2), default=0.0, nullable=False)

    # Referral programme
    referral_code = Column(String(20), unique=True, index=True, nullable=True)
    referred_by_code = Column(String(20), nullable=True)   # code used when this user signed up
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role.value}')>"
    
    def is_admin(self) -> bool:
        """Check if user has admin privileges"""
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    def is_super_admin(self) -> bool:
        """Check if user has super admin privileges"""
        return self.role == UserRole.SUPER_ADMIN
    
    def to_dict(self):
        """Convert user object to dictionary for API responses"""
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "role": self.role.value,
            "oauth_provider": self.oauth_provider.value,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "email_verified": self.email_verified,
            "ai_generations_count": self.ai_generations_count or 0,
            "ai_generation_credits": self.ai_generation_credits or 0,
            "ai_tokens_used": self.ai_tokens_used or 0,
            "ai_refine_tokens_used": self.ai_refine_tokens_used or 0,
            "wallet_balance": float(self.wallet_balance or 0.0),
            "wallet_consumed": float(self.wallet_consumed or 0.0),
            "referral_code": self.referral_code,
            "referred_by_code": self.referred_by_code,
        }