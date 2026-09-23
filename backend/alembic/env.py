from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Alembic Config object — provides access to alembic.ini values.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Import the metadata from ALL models so autogenerate can diff them.
# ---------------------------------------------------------------------------
from app.core.database import Base  # noqa: E402

# Untouched models
from app.models.user import User  # noqa: F401, E402
from app.models.travel import TravelPackage, TravelDeparture, TravelBooking, TravelSettings  # noqa: F401
from app.models import tutor  # noqa: F401  (tutor_subjects, tutor_videos, tutor_availability, tutor_bookings, tutor_settings)
from app.models.contact import Contact  # noqa: F401, E402
from app.models.site_settings import SiteSetting  # noqa: F401, E402
from app.models.page import Page  # noqa: F401, E402
from app.models.community import (  # noqa: F401, E402
    CommunityThread, CommunityPost, CommunityMember,
    CommunityEvent, CommunitySettings,
)

# Renamed models
from app.models.offer import Offer  # noqa: F401, E402
from app.models.content_asset import ContentAsset  # noqa: F401, E402

# New models
from app.models.chat import ChatMessage  # noqa: F401, E402
from app.models.subscription import UserSubscription, Payment  # noqa: F401, E402
from app.models.lead import Lead  # noqa: F401, E402
from app.api.routes.fb_agent_routes import FbAgentState  # noqa: F401, E402
from app.models.founder_site import FounderSite, FounderSiteSlugHistory  # noqa: F401, E402
from app.models.enquiry import Enquiry  # noqa: F401, E402
from app.models.user_ai_credential import UserAiCredential  # noqa: F401, E402
from app.models.ad_management_state import AdManagementState  # noqa: F401, E402
from app.models.trip_request import TripRequest, TripOption, TripItineraryDay  # noqa: F401, E402

target_metadata = Base.metadata

# ---------------------------------------------------------------------------


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — no live DB connection needed."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — requires a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
