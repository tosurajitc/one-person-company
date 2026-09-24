from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from .api.routes import contact_routes, auth_routes, settings_routes, content_routes, page_routes, resource_routes, community_routes, chat_routes, payment_routes, lead_routes, subscriber_routes, agent_session_routes, fb_agent_routes, site_build_routes, genie_routes, referral_routes, enquiry_routes, ad_agent_routes, ai_config_routes, refine_routes, travel_routes, tutor_routes, trip_architect_routes, study_consult_routes
from .core.config import settings
from app.core.database import test_db_connection
from app.db import init_db
from app.core.middleware import AuthenticationMiddleware, SecurityHeadersMiddleware, RequestLoggingMiddleware  # Import our middleware


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Services Platform API",
    description="Backend API for AI Services Platform - Healthcare Analytics & AI Solutions",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS (must be added first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add our custom middleware (order matters - add in reverse order of execution)
app.add_middleware(SecurityHeadersMiddleware)  # Last to execute
app.add_middleware(RequestLoggingMiddleware)   # Second to execute  
app.add_middleware(AuthenticationMiddleware)   # First to execute

# Include routers
app.include_router(contact_routes.router, prefix="/api", tags=["contact"])
app.include_router(auth_routes.router, prefix="/api", tags=["auth"])
app.include_router(settings_routes.router, prefix="/api", tags=["settings"])
app.include_router(content_routes.router, prefix="/api", tags=["content"])
app.include_router(page_routes.router, prefix="/api", tags=["pages"])
app.include_router(resource_routes.router, prefix="/api", tags=["resources"])
app.include_router(community_routes.router, prefix="/api", tags=["community"])
# Note: the old /api/community singleton prefix is gone — all routes are now
# tenant-scoped under /api/communities, /api/community/{id}/..., etc.
app.include_router(chat_routes.router, prefix="/api", tags=["chat"])
app.include_router(payment_routes.router, prefix="/api", tags=["payments"])
app.include_router(lead_routes.router, prefix="/api", tags=["leads"])
app.include_router(subscriber_routes.router, prefix="/api", tags=["subscribers"])
app.include_router(agent_session_routes.router, prefix="/api/agent-session", tags=["agent-session"])
app.include_router(fb_agent_routes.router, prefix="/api", tags=["fb-agent"])
app.include_router(site_build_routes.router, prefix="/api", tags=["sites"])
app.include_router(genie_routes.router, prefix="/api", tags=["genie"])
app.include_router(refine_routes.router, prefix="/api", tags=["genie"])
app.include_router(referral_routes.router, prefix="/api", tags=["referral"])
app.include_router(enquiry_routes.router, prefix="/api/enquiries", tags=["enquiries"])
app.include_router(ad_agent_routes.router, prefix="/api", tags=["ad-agent"])
app.include_router(ai_config_routes.router, prefix="/api", tags=["ai-config"])
app.include_router(travel_routes.public_router)
app.include_router(travel_routes.owner_router)
app.include_router(tutor_routes.public_router)
app.include_router(tutor_routes.owner_router)
app.include_router(trip_architect_routes.router)
app.include_router(study_consult_routes.router)

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Welcome to the AI Services Platform API",
        "version": "0.1.0",
        "project": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = test_db_connection()
    
    return {
        "status": "healthy" if db_status else "degraded",
        "service": "AI Services Platform API",
        "database": "connected" if db_status else "disconnected",
        "version": "0.1.0"
    }

@app.get("/api/db-status")
async def database_status():
    """Check database connection status"""
    try:
        db_connected = test_db_connection()
        return {
            "database_connected": db_connected,
            "database_url": f"postgresql://{settings.DB_USER}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}",
            "status": "success" if db_connected else "failed"
        }
    except Exception as e:
        logger.error(f"Database status check failed: {e}")
        return {
            "database_connected": False,
            "error": str(e),
            "status": "error"
        }

# Protected endpoint example (requires authentication)
@app.get("/api/protected")
async def protected_endpoint(request):
    """Example protected endpoint - requires valid JWT token"""
    user = request.state.user  # User added by AuthenticationMiddleware
    return {
        "message": "This is a protected endpoint",
        "user": {
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    }

# Admin-only endpoint example
@app.get("/api/admin/status")
async def admin_status(request):
    """Example admin-only endpoint"""
    user = request.state.user
    return {
        "message": "Admin access granted",
        "admin": {
            "email": user.email,
            "role": user.role,
            "permissions": "full_access"
        }
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("🚀 AI Services Platform API starting up...")
    
    # Test database connection
    logger.info("Testing database connection...")
    if test_db_connection():
        logger.info("✅ Database connection successful")
        
        # Initialize database and create super admin
        try:
            logger.info("🔧 Initializing database and creating super admin...")
            init_db()
            logger.info("✅ Database initialization completed")
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            
    else:
        logger.error("❌ Database connection failed")
    
    logger.info(f"📊 Project: {settings.PROJECT_NAME}")
    logger.info(f"🗄️ Database: {settings.DB_NAME}")
    logger.info(f"🌐 Server: {settings.SERVER_HOST}")
    logger.info(f"👤 Super Admin: {settings.FIRST_SUPERUSER}")
    logger.info("🔐 Authentication middleware enabled")
    logger.info("🎉 AI Services Platform API startup complete!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 AI Services Platform API shutting down...")