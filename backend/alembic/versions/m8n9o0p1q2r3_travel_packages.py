"""travel-host template: travel_packages, travel_departures, travel_bookings, travel_settings

Additive only — new tables, no changes to existing ones.

Revision ID: m8n9o0p1q2r3
Revises: ea6387773f80
Create Date: 2026-09-23

Before applying: run `alembic heads`. If the head is not ea6387773f80, set
down_revision below to the current head.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "m8n9o0p1q2r3"
down_revision = "ea6387773f80"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "travel_packages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("founder_site_id", sa.Integer(), sa.ForeignKey("founder_sites.id", ondelete="SET NULL"), nullable=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("destination", sa.String(200), nullable=True),
        sa.Column("region", sa.String(20), nullable=False, server_default="india"),
        sa.Column("trip_type", sa.String(30), nullable=False, server_default="group"),
        sa.Column("duration_days", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("duration_nights", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("start_city", sa.String(120), nullable=True),
        sa.Column("price_twin", sa.Numeric(12, 2), nullable=True),
        sa.Column("price_triple", sa.Numeric(12, 2), nullable=True),
        sa.Column("price_single", sa.Numeric(12, 2), nullable=True),
        sa.Column("deposit_override", sa.Numeric(12, 2), nullable=True),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="easy"),
        sa.Column("min_age", sa.Integer(), nullable=True),
        sa.Column("group_size_max", sa.Integer(), nullable=True),
        sa.Column("cover_image", sa.String(500), nullable=True),
        sa.Column("youtube_video_id", sa.String(32), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("highlights", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("itinerary", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("inclusions", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("exclusions", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("stay_type", sa.String(200), nullable=True),
        sa.Column("transport", sa.String(200), nullable=True),
        sa.Column("visa_support", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("booking_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "slug", name="uq_travel_packages_user_slug"),
    )
    op.create_index("ix_travel_packages_id", "travel_packages", ["id"])
    op.create_index("ix_travel_packages_user_status", "travel_packages", ["user_id", "status"])

    op.create_table(
        "travel_departures",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("package_id", sa.Integer(), sa.ForeignKey("travel_packages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("seats_total", sa.Integer(), nullable=False, server_default="16"),
        sa.Column("seats_booked", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("price_override", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("booking_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("seats_booked >= 0 AND seats_booked <= seats_total", name="ck_travel_departures_seats"),
    )
    op.create_index("ix_travel_departures_id", "travel_departures", ["id"])
    op.create_index("ix_travel_departures_package_date", "travel_departures", ["package_id", "start_date"])

    op.create_table(
        "travel_bookings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("package_id", sa.Integer(), sa.ForeignKey("travel_packages.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("departure_id", sa.Integer(), sa.ForeignKey("travel_departures.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(40), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("travellers", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("sharing", sa.String(10), nullable=False, server_default="twin"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("per_person_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("deposit_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="requested"),
        sa.Column("hold_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payment_id", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_travel_bookings_id", "travel_bookings", ["id"])
    op.create_index("ix_travel_bookings_owner_status", "travel_bookings", ["owner_user_id", "status"])
    op.create_index("ix_travel_bookings_departure_status", "travel_bookings", ["departure_id", "status"])

    op.create_table(
        "travel_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("settings", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_travel_settings_id", "travel_settings", ["id"])


def downgrade() -> None:
    op.drop_index("ix_travel_settings_id", table_name="travel_settings")
    op.drop_table("travel_settings")
    op.drop_index("ix_travel_bookings_departure_status", table_name="travel_bookings")
    op.drop_index("ix_travel_bookings_owner_status", table_name="travel_bookings")
    op.drop_index("ix_travel_bookings_id", table_name="travel_bookings")
    op.drop_table("travel_bookings")
    op.drop_index("ix_travel_departures_package_date", table_name="travel_departures")
    op.drop_index("ix_travel_departures_id", table_name="travel_departures")
    op.drop_table("travel_departures")
    op.drop_index("ix_travel_packages_user_status", table_name="travel_packages")
    op.drop_index("ix_travel_packages_id", table_name="travel_packages")
    op.drop_table("travel_packages")