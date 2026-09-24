"""add consult_requests table (study-abroad consultant template, V1)

Revision ID: sa7c1d90e4b2
Revises: n9o0p1q2r3s4
Create Date: 2026-09-24

VERIFY BEFORE APPLYING:
  1. Run `alembic heads` from backend/. It must print exactly one head: sa7c1d90e4b2.
  2. Confirm founder_sites.id is an Integer (see models/consult_request.py).
  3. Back up first: pg_dump ai_services_platform > backup_consult_requests.sql
  4. Additive only: creates one table, touches nothing else.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "sa7c1d90e4b2"
down_revision = "n9o0p1q2r3s4"  # verified: current head (trip_requests)
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "consult_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ref", sa.String(length=16), nullable=False),
        sa.Column("founder_site_id", sa.Integer(), sa.ForeignKey("founder_sites.id", ondelete="CASCADE"), nullable=False),
        sa.Column("consultation_type", sa.String(length=64), nullable=False),
        sa.Column("mode", sa.String(length=32), nullable=True),
        sa.Column("preferred_window", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=True),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("profile", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("custom", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("consent", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="new"),
        sa.Column("owner_notes", sa.Text(), nullable=True),
        sa.Column("source_ip_hash", sa.String(length=64), nullable=True),
        sa.Column("webhook_status", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_consult_requests_id", "consult_requests", ["id"])
    op.create_index("ix_consult_requests_ref", "consult_requests", ["ref"], unique=True)
    op.create_index("ix_consult_requests_founder_site_id", "consult_requests", ["founder_site_id"])
    op.create_index("ix_consult_requests_email", "consult_requests", ["email"])
    op.create_index(
        "ix_consult_requests_site_status_created",
        "consult_requests",
        ["founder_site_id", "status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_consult_requests_site_status_created", table_name="consult_requests")
    op.drop_index("ix_consult_requests_email", table_name="consult_requests")
    op.drop_index("ix_consult_requests_founder_site_id", table_name="consult_requests")
    op.drop_index("ix_consult_requests_ref", table_name="consult_requests")
    op.drop_index("ix_consult_requests_id", table_name="consult_requests")
    op.drop_table("consult_requests")
