"""
Pydantic schemas for user/auth API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserLoginRequest(BaseModel):
    """Used by POST /api/auth/login — accepts plain username, not just email."""
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

    model_config = {"json_schema_extra": {"example": {"email": "admin", "password": "password"}}}


class UserSignupRequest(BaseModel):
    """Used by POST /api/auth/signup — plain email + password registration, no OAuth required."""
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=255)


class UserRegisterRequest(BaseModel):
    """
    Used by POST /api/auth/register.
    Since the app is OAuth-only, the frontend sends user info
    obtained from the OAuth provider.
    """
    email: str = Field(..., min_length=1)
    full_name: str = Field(..., min_length=1, max_length=255)
    oauth_provider: str = Field(..., description="google | microsoft | github | linkedin")
    oauth_id: str = Field(..., description="Provider's user ID")
    avatar_url: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "full_name": "Jane Doe",
                "oauth_provider": "google",
                "oauth_id": "1234567890",
                "avatar_url": "https://lh3.googleusercontent.com/..."
            }
        }


class UserResponse(BaseModel):
    """Serialised user returned in API responses."""
    id: int
    email: str
    full_name: str
    avatar_url: Optional[str]
    role: str
    oauth_provider: str
    is_active: bool
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True  # SQLAlchemy → Pydantic

    # Flatten enum values to strings for JSON serialisation
    @classmethod
    def model_validate(cls, obj, **kwargs):
        if hasattr(obj, "role") and hasattr(obj.role, "value"):
            obj_dict = {
                "id": obj.id,
                "email": obj.email,
                "full_name": obj.full_name,
                "avatar_url": obj.avatar_url,
                "role": obj.role.value,
                "oauth_provider": obj.oauth_provider.value if obj.oauth_provider else "local",
                "is_active": obj.is_active,
                "email_verified": obj.email_verified,
                "created_at": obj.created_at,
                "last_login": obj.last_login,
            }
            return cls(**obj_dict)
        return super().model_validate(obj, **kwargs)


class TokenResponse(BaseModel):
    """Returned by login, register, and OAuth callback."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class OAuthCallbackRequest(BaseModel):
    """
    Used by POST /api/auth/oauth/callback.
    The frontend sends the provider name + code it received from the redirect.
    """
    provider: str = Field(..., description="google | microsoft | github | linkedin")
    code: str = Field(..., description="Authorization code from OAuth provider")
    redirect_uri: str = Field(..., description="Must match what was used in the initial OAuth request")

    class Config:
        json_schema_extra = {
            "example": {
                "provider": "google",
                "code": "4/0AY0e-g7...",
                "redirect_uri": "http://localhost:3000/auth/callback"
            }
        }
