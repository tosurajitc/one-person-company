"""extend_offer_type_enum

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-15 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL requires ALTER TYPE to add enum values
    op.execute("ALTER TYPE offertype ADD VALUE IF NOT EXISTS 'video'")
    op.execute("ALTER TYPE offertype ADD VALUE IF NOT EXISTS 'audio'")
    op.execute("ALTER TYPE offertype ADD VALUE IF NOT EXISTS 'book'")
    op.execute("ALTER TYPE offertype ADD VALUE IF NOT EXISTS 'event'")
    op.execute("ALTER TYPE offertype ADD VALUE IF NOT EXISTS 'physical'")
    op.execute("ALTER TYPE offertype ADD VALUE IF NOT EXISTS 'bundle'")
    op.execute("ALTER TYPE offertype ADD VALUE IF NOT EXISTS 'other'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly.
    # To downgrade, the enum would need to be recreated — skipped for safety.
    pass
