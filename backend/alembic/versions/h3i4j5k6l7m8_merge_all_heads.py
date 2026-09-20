"""merge all heads: b7c8d9e0f1a2, e3f4a5b6c7d8, g2h3i4j5k6l7

Revision ID: h3i4j5k6l7m8
Revises: b7c8d9e0f1a2, e3f4a5b6c7d8, g2h3i4j5k6l7
Create Date: 2025-01-01 00:00:00.000001

Merge point so that `alembic upgrade head` resolves to a single head.
No DDL changes — this is a bookkeeping-only migration.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'h3i4j5k6l7m8'
down_revision = ('b7c8d9e0f1a2', 'e3f4a5b6c7d8', 'g2h3i4j5k6l7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass  # merge only — no schema changes


def downgrade() -> None:
    pass
