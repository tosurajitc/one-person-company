"""
Auth routes — login, logout, verify, change-password, OAuth callback, current user.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from typing import Optional
import bcrypt as _bcrypt
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import AuthService, SecurityService, AuthenticationError, OAuthService
from app.core.oauth import OAuthClient, OAuthConfig
from app.core.config import settings
from app.models.user import User, UserRole, OAuthProvider
from app.models.lead import Lead
from app.schemas.user_schemas import (
    UserLoginRequest,
    UserRegisterRequest,
    UserSignupRequest,
    UserResponse,
    TokenResponse,
    OAuthCallbackRequest,
)
from app.core.dependencies import get_current_admin_user

def _verify_pw(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def _hash_pw(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")

router = APIRouter(prefix="/auth", tags=["auth"])

# ─────────────────────────────────────────────
# POST /api/auth/login  (email + password — for admin seeded user)
# ─────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate with username (email field) + password."""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Must have a password hash (local accounts only)
    if not user.password_hash or not _verify_pw(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = AuthService.create_user_token(user)

    # JS-readable cookie — Next.js middleware reads it server-side,
    # and the frontend login page sets it via document.cookie too.
    # httponly=False so the frontend JS can write/read the same cookie name.
    response.set_cookie(
        key="token",
        value=token,
        httponly=False,
        samesite="lax",
        secure=False,   # Set True in production (HTTPS)
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ─────────────────────────────────────────────
# POST /api/auth/register
# ─────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, response: Response, db: Session = Depends(get_db)):
    """Register a new user (OAuth-sourced, provider info required)."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    try:
        provider = OAuthProvider(payload.oauth_provider)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {payload.oauth_provider}",
        )

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
        oauth_provider=provider,
        oauth_id=payload.oauth_id,
        is_active=True,
        email_verified=True,
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Link any leads previously captured with this email
    db.query(Lead).filter(
        Lead.email == payload.email.strip().lower(),
        Lead.converted_to_user_id.is_(None)
    ).update({"converted_to_user_id": user.id}, synchronize_session=False)
    db.commit()

    token = AuthService.create_user_token(user)

    response.set_cookie(
        key="token",
        value=token,
        httponly=False,
        samesite="lax",
        secure=False,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ─────────────────────────────────────────────
# POST /api/auth/signup  (email + password — self-service registration)
# ─────────────────────────────────────────────
@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserSignupRequest, response: Response, db: Session = Depends(get_db)):
    """Register a new user with email and password (no OAuth required)."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=_hash_pw(payload.password),
        is_active=True,
        email_verified=False,
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Link any leads previously captured with this email (non-fatal if table missing)
    try:
        db.query(Lead).filter(
            Lead.email == payload.email.strip().lower(),
            Lead.converted_to_user_id.is_(None)
        ).update({"converted_to_user_id": user.id}, synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()

    token = AuthService.create_user_token(user)

    response.set_cookie(
        key="token",
        value=token,
        httponly=False,
        samesite="lax",
        secure=False,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ─────────────────────────────────────────────
# POST /api/auth/logout
# ─────────────────────────────────────────────
@router.post("/logout")
async def logout(response: Response):
    """Clear the auth cookie."""
    response.delete_cookie(key="token")
    return {"message": "Logged out successfully"}


# ─────────────────────────────────────────────
# POST /api/auth/change-password  (admin only)
# ─────────────────────────────────────────────
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Change the admin account password."""
    if not current_user.password_hash or not _verify_pw(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters")

    current_user.password_hash = _hash_pw(payload.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}


# ─────────────────────────────────────────────
# GET /api/auth/verify  — used by AuthContext.js on app load
# ─────────────────────────────────────────────
@router.get("/verify")
async def verify_token(request: Request, db: Session = Depends(get_db)):
    """Verify the JWT token passed in Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token provided")

    token = auth_header.split(" ", 1)[1]
    user = AuthService.get_user_from_token(token, db)

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    return {"valid": True, "user": UserResponse.model_validate(user)}


# ─────────────────────────────────────────────
# GET /api/auth/me  — returns current user from cookie/header
# ─────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Return the authenticated user's profile."""
    # Try cookie first (Next.js middleware sets it)
    token = request.cookies.get("token")

    # Fall back to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user = AuthService.get_user_from_token(token, db)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    return UserResponse.model_validate(user)


# ─────────────────────────────────────────────
# GET /api/auth/oauth/callback  — OAuth provider redirects here
# ─────────────────────────────────────────────
@router.post("/oauth/callback", response_model=TokenResponse)
async def oauth_callback(
    payload: OAuthCallbackRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Exchange an OAuth code for a token.  The frontend sends the provider
    name + authorization code it received from the provider redirect.
    """
    client_id, client_secret = OAuthConfig.get_client_credentials(payload.provider)
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OAuth provider '{payload.provider}' is not configured on this server",
        )

    oauth = OAuthClient()
    try:
        token_data = await oauth.exchange_code_for_token(
            provider=payload.provider,
            code=payload.code,
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=payload.redirect_uri,
        )
        if not token_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to exchange OAuth code")

        provider_access_token = token_data.get("access_token")
        user_info = await oauth.get_user_info(payload.provider, provider_access_token)
        if not user_info or not user_info.get("email"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not retrieve user info from provider")
    finally:
        await oauth.close()

    # Upsert user
    user = db.query(User).filter(User.email == user_info["email"]).first()
    try:
        provider_enum = OAuthProvider(payload.provider)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown provider")

    if not user:
        user = User(
            email=user_info["email"],
            full_name=user_info.get("name", user_info["email"]),
            avatar_url=user_info.get("avatar_url"),
            oauth_provider=provider_enum,
            oauth_id=str(user_info.get("id", "")),
            is_active=True,
            email_verified=user_info.get("verified_email", True),
            role=UserRole.USER,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Link any leads previously captured with this email
        db.query(Lead).filter(
            Lead.email == user_info["email"].strip().lower(),
            Lead.converted_to_user_id.is_(None)
        ).update({"converted_to_user_id": user.id}, synchronize_session=False)
        db.commit()
    else:
        # Update avatar if changed
        if user_info.get("avatar_url"):
            user.avatar_url = user_info["avatar_url"]
        # Also ensure unconverted leads for existing user are attributed
        db.query(Lead).filter(
            Lead.email == user.email.strip().lower(),
            Lead.converted_to_user_id.is_(None)
        ).update({"converted_to_user_id": user.id}, synchronize_session=False)
        db.commit()

    token = AuthService.create_user_token(user)

    response.set_cookie(
        key="token",
        value=token,
        httponly=False,
        samesite="lax",
        secure=False,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ─────────────────────────────────────────────
# POST /api/auth/oauth/{provider}/url  — generate authorization redirect URL
# ─────────────────────────────────────────────
class OAuthUrlRequest(BaseModel):
    state: str

@router.post("/oauth/{provider}/url")
async def get_oauth_url(provider: str, payload: OAuthUrlRequest):
    """Return the OAuth authorization URL for the requested provider."""
    client_id, _ = OAuthConfig.get_client_credentials(provider)
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OAuth provider '{provider}' is not configured on this server",
        )
    redirect_uri = f"{settings.FRONTEND_URL}/auth/callback"
    url = OAuthService.get_authorization_url(
        provider=provider,
        client_id=client_id,
        redirect_uri=redirect_uri,
        state=payload.state,
    )
    return {"authorization_url": url}
