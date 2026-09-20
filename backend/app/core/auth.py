from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import secrets
import hashlib
from app.models.user import User, UserRole
from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

class AuthService:
    """Authentication service for handling JWT tokens and user authentication"""
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def get_user_from_token(token: str, db: Session) -> Optional[User]:
        """Get user from JWT token"""
        try:
            payload = AuthService.verify_token(token)
            if payload is None:
                return None
            
            user_id: int = payload.get("sub")
            if user_id is None:
                return None
            
            user = db.query(User).filter(User.id == user_id).first()
            return user
        except Exception:
            return None
    
    @staticmethod
    def create_user_token(user: User) -> str:
        """Create token for authenticated user"""
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role.value},
            expires_delta=access_token_expires
        )
        return access_token

class OAuthService:
    """OAuth service for handling external authentication providers"""
    
    OAUTH_PROVIDERS = {
        "google": {
            "authorize_url": "https://accounts.google.com/o/oauth2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "user_info_url": "https://www.googleapis.com/oauth2/v2/userinfo",
            "scopes": ["openid", "email", "profile"]
        },
        "facebook": {
            "authorize_url": "https://www.facebook.com/v18.0/dialog/oauth",
            "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
            "user_info_url": "https://graph.facebook.com/me",
            "scopes": ["email", "public_profile"]
        },
        "github": {
            "authorize_url": "https://github.com/login/oauth/authorize",
            "token_url": "https://github.com/login/oauth/access_token",
            "user_info_url": "https://api.github.com/user",
            "scopes": ["user:email"]
        },
        "linkedin": {
            "authorize_url": "https://www.linkedin.com/oauth/v2/authorization",
            "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
            "user_info_url": "https://api.linkedin.com/v2/userinfo",
            "scopes": ["openid", "profile", "email"]
        }
    }
    
    @staticmethod
    def get_authorization_url(provider: str, client_id: str, redirect_uri: str, state: str = None) -> str:
        """Generate OAuth authorization URL"""
        if provider not in OAuthService.OAUTH_PROVIDERS:
            raise ValueError(f"Unsupported OAuth provider: {provider}")
        
        config = OAuthService.OAUTH_PROVIDERS[provider]
        scopes = " ".join(config["scopes"])
        
        if state is None:
            state = secrets.token_urlsafe(32)
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": scopes,
            "response_type": "code",
            "state": state
        }

        from urllib.parse import urlencode
        return f"{config['authorize_url']}?{urlencode(params)}"
    
    @staticmethod
    def generate_state_token() -> str:
        """Generate secure state token for OAuth"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def verify_state_token(received_state: str, stored_state: str) -> bool:
        """Verify OAuth state token"""
        return secrets.compare_digest(received_state, stored_state)

class SecurityService:
    """Security utilities for authentication"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def generate_random_password(length: int = 12) -> str:
        """Generate secure random password"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def create_api_key() -> str:
        """Generate API key for users"""
        return f"ak_{secrets.token_urlsafe(32)}"
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()

class PermissionService:
    """Service for handling user permissions and role-based access"""
    
    @staticmethod
    def check_admin_permission(user: User) -> bool:
        """Check if user has admin permissions"""
        return user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @staticmethod
    def check_super_admin_permission(user: User) -> bool:
        """Check if user has super admin permissions"""
        return user.role == UserRole.SUPER_ADMIN
    
    @staticmethod
    def can_manage_users(user: User) -> bool:
        """Check if user can manage other users"""
        return user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @staticmethod
    def can_access_admin_panel(user: User) -> bool:
        """Check if user can access admin panel"""
        return user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @staticmethod
    def can_modify_user_role(current_user: User, target_user: User, new_role: UserRole) -> bool:
        """Check if current user can modify target user's role"""
        # Super admin can do anything
        if current_user.role == UserRole.SUPER_ADMIN:
            return True
        
        # Admin can promote users to admin but not to super admin
        if current_user.role == UserRole.ADMIN:
            # Cannot modify super admin
            if target_user.role == UserRole.SUPER_ADMIN:
                return False
            # Cannot promote to super admin
            if new_role == UserRole.SUPER_ADMIN:
                return False
            return True
        
        # Regular users cannot modify roles
        return False

# Exception classes for authentication
class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class AuthorizationError(HTTPException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )

class InvalidTokenError(HTTPException):
    def __init__(self, detail: str = "Invalid or expired token"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )