from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
import enum
from datetime import datetime

from app.core.database import Base

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
        }