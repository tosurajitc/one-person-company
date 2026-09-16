"""
Authentication and security middleware for FastAPI
"""

import logging
from typing import Optional
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from app.core.auth import AuthService, AuthenticationError, AuthorizationError
from app.core.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle JWT authentication for protected routes
    """
    
    # Routes that don't require authentication
    PUBLIC_PATHS = [
        "/",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/logout",
        "/api/auth/verify",
        "/api/auth/oauth",
        "/api/auth/me",
        "/api/contact",
        "/api/db-status",
        "/api/chat",
        "/api/payments/webhook",          # Razorpay + Stripe webhook receivers
        "/api/content/offers/public",     # public offer landing page lookup
    ]
    
    # Admin-only paths
    ADMIN_PATHS = [
        "/api/admin",
        "/api/users/manage",
    ]

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """
        Process each request through authentication middleware
        """
        path = request.url.path
        method = request.method
        
        # Log request for debugging
        logger.debug(f"{method} {path}")
        
        # Skip authentication for public paths
        if self._is_public_path(path):
            response = await call_next(request)
            return response
        
        # Check for admin-only paths
        is_admin_path = self._is_admin_path(path)
        
        # Extract and validate JWT token
        try:
            user = await self._authenticate_request(request)
            
            # Add user to request state for use in endpoints
            request.state.user = user
            
            # Check admin permissions for admin paths
            if is_admin_path and not user.is_admin():
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "Admin access required"}
                )
            
            # Continue to endpoint
            response = await call_next(request)
            return response
            
        except AuthenticationError as e:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": str(e)},
                headers={"WWW-Authenticate": "Bearer"}
            )
        except AuthorizationError as e:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": str(e)}
            )
        except Exception as e:
            logger.error(f"Middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Authentication service error"}
            )

    def _is_public_path(self, path: str) -> bool:
        """Check if path is public (no authentication required)"""
        for public_path in self.PUBLIC_PATHS:
            if path.startswith(public_path):
                return True
        return False

    def _is_admin_path(self, path: str) -> bool:
        """Check if path requires admin access"""
        for admin_path in self.ADMIN_PATHS:
            if path.startswith(admin_path):
                return True
        return False

    async def _authenticate_request(self, request: Request) -> User:
        """Extract and validate JWT token from request"""
        # Get Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            raise AuthenticationError("Authorization header missing")
        
        # Extract Bearer token
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise AuthenticationError("Invalid authentication scheme")
        except ValueError:
            raise AuthenticationError("Invalid authorization header format")
        
        # Validate token and get user
        db = SessionLocal()
        try:
            user = AuthService.get_user_from_token(token, db)
            if not user:
                raise AuthenticationError("Invalid token")
            
            if not user.is_active:
                raise AuthenticationError("Account is inactive")
            
            return user
            
        finally:
            db.close()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers
    """
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log requests for monitoring and debugging
    """
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Log request
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {client_ip} ({user_agent})"
        )
        
        # Process request
        response = await call_next(request)
        
        # Log response
        logger.info(
            f"Response: {response.status_code} for {request.method} {request.url.path}"
        )
        
        return response