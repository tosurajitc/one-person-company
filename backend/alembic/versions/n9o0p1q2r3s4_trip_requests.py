"""trip_requests, trip_options, trip_itinerary_days (Trip Architect)

Revision ID: n9o0p1q2r3s4
Revises: t7u8v9w0x1y2
Create Date: 2026-09-23

Additive only — three new tables, no changes to any existing table.
Companion to app/models/trip_request.py; import that module in
alembic/env.py before running --autogenerate against this chain.

down_revision points at t7u8v9w0x1y2 — the mergepoint that already
folded travel-host (m8n9o0p1q2r3) and tutor-training (f5a6b7c8d9e0)
into a single head, confirmed via `alembic show t7u8v9w0x1y2` on
2026-09-23. Do not rebase this onto m8n9o0p1q2r3 directly — that
revision is superseded.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'n9o0p1q2r3s4'
down_revision = 't7u8v9w0x1y2'
branch_labels = None
depends_on = None


def upgrade():
    # ─── trip_requests ──────────────────────────────────────────────────────
    op.create_table(
        'trip_requests',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('founder_site_id', sa.Integer(), nullable=False),

        sa.Column('traveller_name', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),

        sa.Column('destinations', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('date_mode', sa.String(length=20), nullable=False, server_default='fixed'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('flex_window_notes', sa.Text(), nullable=True),
        sa.Column('traveller_count', sa.Integer(), nullable=True),
        sa.Column('ages', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('interests', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('pace', sa.String(length=20), nullable=True),
        sa.Column('dietary_needs', sa.Text(), nullable=True),
        sa.Column('accessibility_needs', sa.Text(), nullable=True),
        sa.Column('budget_min', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('budget_max', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
        sa.Column('message', sa.Text(), nullable=True),

        sa.Column('status', sa.String(length=20), nullable=False, server_default='new'),

        sa.Column('share_token', sa.String(length=64), nullable=True),
        sa.Column('share_token_created_at', sa.DateTime(timezone=True), nullable=True),

        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),

        sa.ForeignKeyConstraint(['founder_site_id'], ['founder_sites.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_trip_requests_founder_site_id', 'trip_requests', ['founder_site_id'])
    op.create_index('ix_trip_requests_email', 'trip_requests', ['email'])
    op.create_index('ix_trip_requests_status', 'trip_requests', ['status'])
    op.create_index('ix_trip_requests_share_token', 'trip_requests', ['share_token'], unique=True)

    # ─── trip_options ───────────────────────────────────────────────────────
    op.create_table(
        'trip_options',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('trip_request_id', sa.Integer(), nullable=False),

        sa.Column('category', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('provider_contact', sa.String(length=255), nullable=True),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
        sa.Column('inclusions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('cancellation_terms', sa.Text(), nullable=True),
        sa.Column('is_recommended', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),

        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),

        sa.ForeignKeyConstraint(['trip_request_id'], ['trip_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_trip_options_trip_request_id', 'trip_options', ['trip_request_id'])

    # ─── trip_itinerary_days ────────────────────────────────────────────────
    op.create_table(
        'trip_itinerary_days',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('trip_request_id', sa.Integer(), nullable=False),

        sa.Column('day_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('sightseeing_order', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('travel_time_notes', sa.Text(), nullable=True),
        sa.Column('rest_time_notes', sa.Text(), nullable=True),
        sa.Column('entry_fees', sa.Text(), nullable=True),
        sa.Column('meal_suggestions', sa.Text(), nullable=True),
        sa.Column('estimated_food_spend', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('local_transport_notes', sa.Text(), nullable=True),
        sa.Column('contingency_notes', sa.Text(), nullable=True),

        sa.ForeignKeyConstraint(['trip_request_id'], ['trip_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('trip_request_id', 'day_number', name='uq_trip_itinerary_day_number'),
    )
    op.create_index('ix_trip_itinerary_days_trip_request_id', 'trip_itinerary_days', ['trip_request_id'])


def downgrade():
    op.drop_index('ix_trip_itinerary_days_trip_request_id', table_name='trip_itinerary_days')
    op.drop_table('trip_itinerary_days')

    op.drop_index('ix_trip_options_trip_request_id', table_name='trip_options')
    op.drop_table('trip_options')

    op.drop_index('ix_trip_requests_share_token', table_name='trip_requests')
    op.drop_index('ix_trip_requests_status', table_name='trip_requests')
    op.drop_index('ix_trip_requests_email', table_name='trip_requests')
    op.drop_index('ix_trip_requests_founder_site_id', table_name='trip_requests')
    op.drop_table('trip_requests')