"""
Authentication and security middleware for FastAPI
------------------------------------------------------------------
Phase 0 fix. Replaces the old prefix-based PUBLIC_PATHS list, where "/" matched
every route and "/api/contact" also opened "/api/contacts" (admin data).

How access is decided, per request:
  1. OPTIONS (CORS preflight)          -> always allowed
  2. Matches ADMIN_ROUTES               -> valid token AND admin role required
  3. Matches PUBLIC_ROUTES (method+path)-> allowed without a token
  4. Everything else                    -> valid token required

Tokens are read from the Authorization header ("Bearer ...") or the "token" cookie.

Safe rollout switch (backend/.env):
  AUTH_MIDDLEWARE_MODE=report   -> never blocks; logs "WOULD BLOCK ..." warnings
  AUTH_MIDDLEWARE_MODE=enforce  -> blocks (default)

Rate limiting for public AI and form routes (in-memory, per client IP):
  RATE_LIMIT_ENABLED=true (default) | false
"""

import logging
import os
import re
import time
from collections import defaultdict, deque
from threading import Lock
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.auth import AuthService, AuthenticationError, AuthorizationError
from app.core.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)


def _env_setting(name: str, default: str) -> str:
    """Read a setting from the process environment first, then backend/.env."""
    value = os.getenv(name)
    if value is not None:
        return value
    try:
        from dotenv import dotenv_values  # installed with pydantic-settings
        env_file = Path(__file__).resolve().parents[2] / ".env"
        if env_file.exists():
            value = dotenv_values(env_file).get(name)
    except Exception:  # dotenv missing or unreadable file
        value = None
    return value if value is not None else default


def _compile(pattern: str) -> re.Pattern:
    """'/api/pages/slug/{slug}' -> exact regex; {param} matches one path segment."""
    escaped = re.escape(pattern.rstrip("/") or "/")
    regex = re.sub(r"\\\{[^/]+?\\\}", r"[^/]+", escaped)
    return re.compile(rf"^{regex}/?$")


def _compile_prefix(prefix: str) -> re.Pattern:
    """'/api/contacts' -> matches '/api/contacts' and '/api/contacts/...' but NOT '/api/contactsX'."""
    return re.compile(rf"^{re.escape(prefix.rstrip('/'))}(/.*)?$")


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """JWT authentication with exact, per-method public routes."""

    # (method, path). Exact match; {param} = one path segment. "*" = any method.
    PUBLIC_ROUTES = [
        # System
        ("GET", "/"),
        ("GET", "/health"),
        ("GET", "/docs"),
        ("GET", "/docs/oauth2-redirect"),
        ("GET", "/redoc"),
        ("GET", "/openapi.json"),
        # Auth (these handle tokens themselves)
        ("POST", "/api/auth/login"),
        ("POST", "/api/auth/register"),
        ("POST", "/api/auth/signup"),
        ("POST", "/api/auth/logout"),
        ("POST", "/api/auth/oauth/callback"),
        ("POST", "/api/auth/oauth/{provider}/url"),
        ("GET", "/api/auth/verify"),
        ("GET", "/api/auth/me"),
        # Public site data
        ("GET", "/api/settings/public"),
        ("GET", "/api/settings/playbook_categories"),
        ("GET", "/api/pages/public"),
        ("GET", "/api/pages/slug/{slug}"),
        ("GET", "/api/resources/public"),
        ("GET", "/api/content/offers/public/{username}/{slug}"),
        ("GET", "/api/public/{username}/community/{slug}"),
        ("GET", "/api/sites/public/{slug}"),
        # Visitor forms
        ("POST", "/api/contact"),
        ("GET", "/api/contact/health"),
        ("POST", "/api/leads"),
        ("POST", "/api/subscribers"),
        # AI for guests (rate limited below)
        ("POST", "/api/chat"),
        ("POST", "/api/chat/prefill"),
        ("POST", "/api/genie/draft-site"),
        ("POST", "/api/genie/intake"),
        ("GET", "/api/genie/status"),
        # Payment gateway webhooks (verified by signature inside the route)
        ("POST", "/api/payments/webhook/razorpay"),
        ("POST", "/api/payments/webhook/stripe"),
    ]

    # Prefixes that require an admin. Matched on whole path segments.
    ADMIN_PREFIXES = [
        "/api/admin",
        "/api/users/manage",
        "/api/contacts",      # contact submissions (list, read, edit, delete)
        "/api/db-status",     # exposes database connection details
    ]

    # (method, path, max requests, window seconds) - per client IP
    RATE_LIMITS = [
        ("POST", "/api/chat", 30, 600),
        ("POST", "/api/chat/prefill", 10, 600),
        ("POST", "/api/chat/prefill-and-save", 10, 600),
        ("POST", "/api/genie/draft-site", 10, 600),
        ("POST", "/api/contact", 5, 600),
        ("POST", "/api/leads", 10, 600),
        ("POST", "/api/subscribers", 5, 600),
        ("POST", "/api/auth/login", 10, 600),
        ("POST", "/api/auth/register", 5, 600),
        ("POST", "/api/auth/signup", 5, 600),
    ]

    def __init__(self, app):
        super().__init__(app)
        self.mode = _env_setting("AUTH_MIDDLEWARE_MODE", "enforce").strip().lower()
        if self.mode not in ("enforce", "report"):
            self.mode = "enforce"
        self.rate_limit_enabled = _env_setting("RATE_LIMIT_ENABLED", "true").strip().lower() != "false"
        self._public = [(m.upper(), _compile(p)) for m, p in self.PUBLIC_ROUTES]
        self._admin = [_compile_prefix(p) for p in self.ADMIN_PREFIXES]
        self._limits = [(m.upper(), _compile(p), n, w) for m, p, n, w in self.RATE_LIMITS]
        self._hits = defaultdict(deque)
        self._lock = Lock()
        if self.mode == "report":
            logger.warning("AuthenticationMiddleware in REPORT mode: requests are logged, never blocked")

    # -- Rules ----------------------------------------------
    def is_public(self, method: str, path: str) -> bool:
        method = method.upper()
        return any((m == "*" or m == method) and rx.match(path) for m, rx in self._public)

    def is_admin_path(self, path: str) -> bool:
        return any(rx.match(path) for rx in self._admin)

    # Backwards-compatible names used elsewhere
    def _is_public_path(self, path: str, method: str = "GET") -> bool:
        return self.is_public(method, path)

    def _is_admin_path(self, path: str) -> bool:
        return self.is_admin_path(path)

    # -- Dispatch -------------------------------------------
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        method = request.method.upper()

        if method == "OPTIONS":
            return await call_next(request)

        limited = self._check_rate_limit(request, method, path)
        if limited is not None:
            return limited

        admin_required = self.is_admin_path(path)

        if not admin_required and self.is_public(method, path):
            return await call_next(request)

        try:
            user = await self._authenticate_request(request)
            request.state.user = user
            if admin_required and not user.is_admin():
                return await self._deny(request, status.HTTP_403_FORBIDDEN, "Admin access required", call_next)
            return await call_next(request)
        except AuthenticationError as exc:
            return await self._deny(request, status.HTTP_401_UNAUTHORIZED, self._detail(exc, "Authentication required"), call_next)
        except AuthorizationError as exc:
            return await self._deny(request, status.HTTP_403_FORBIDDEN, self._detail(exc, "Not allowed"), call_next)
        except HTTPException as exc:
            code = exc.status_code if exc.status_code in (401, 403) else status.HTTP_401_UNAUTHORIZED
            return await self._deny(request, code, self._detail(exc, "Authentication required"), call_next)
        except Exception as exc:  # never leak internals
            logger.error("Middleware error on %s %s: %s", method, path, exc)
            return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Authentication service error"})

    @staticmethod
    def _detail(exc: Exception, default: str) -> str:
        detail = getattr(exc, "detail", None)
        if isinstance(detail, str) and detail:
            return detail
        text = str(exc)
        return text if text else default

    async def _deny(self, request: Request, code: int, detail: str, call_next: RequestResponseEndpoint) -> Response:
        if self.mode == "report":
            logger.warning("WOULD BLOCK %s %s -> %s (%s)", request.method, request.url.path, code, detail)
            return await call_next(request)
        headers = {"WWW-Authenticate": "Bearer"} if code == status.HTTP_401_UNAUTHORIZED else None
        return JSONResponse(status_code=code, content={"detail": detail}, headers=headers)

    # -- Token ----------------------------------------------
    @staticmethod
    def _extract_token(request: Request) -> Optional[str]:
        auth_header = request.headers.get("Authorization", "")
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1]:
                return parts[1]
            raise AuthenticationError("Invalid authorization header format")
        return request.cookies.get("token") or None

    async def _authenticate_request(self, request: Request) -> User:
        token = self._extract_token(request)
        if not token:
            raise AuthenticationError("Authentication required")
        db = SessionLocal()
        try:
            user = AuthService.get_user_from_token(token, db)
            if not user:
                raise AuthenticationError("Invalid token")
            if not getattr(user, "is_active", False):
                raise AuthenticationError("Account is inactive")
            return user
        finally:
            db.close()

    # -- Rate limiting --------------------------------------
    @staticmethod
    def _client_ip(request: Request) -> str:
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _check_rate_limit(self, request: Request, method: str, path: str) -> Optional[Response]:
        if not self.rate_limit_enabled:
            return None
        for m, rx, max_hits, window in self._limits:
            if m != method or not rx.match(path):
                continue
            key = (self._client_ip(request), rx.pattern)
            now = time.monotonic()
            with self._lock:
                hits = self._hits[key]
                while hits and now - hits[0] > window:
                    hits.popleft()
                if len(hits) >= max_hits:
                    retry = int(window - (now - hits[0])) + 1
                    logger.warning("Rate limit hit: %s %s from %s", method, path, key[0])
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={"detail": "Too many requests. Please wait a few minutes and try again."},
                        headers={"Retry-After": str(retry)},
                    )
                hits.append(now)
            return None
        return None


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers (unchanged)."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log requests for monitoring and debugging (unchanged)."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        logger.info(f"Request: {request.method} {request.url.path} from {client_ip} ({user_agent})")
        response = await call_next(request)
        logger.info(f"Response: {response.status_code} for {request.method} {request.url.path}")
        return response