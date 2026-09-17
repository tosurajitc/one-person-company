"""add schema_version to user_site_settings

Revision ID: f1a2b3c4d5e6
Revises: d4e5f6a7b8c9
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add schema_version column so the backend can distinguish v1 (old flat wizard)
    # from v2 (nested domain-grouped wizard introduced in schema 2.0).
    op.add_column(
        'user_site_settings',
        sa.Column(
            'schema_version',
            sa.String(10),
            nullable=False,
            server_default='1.0',
        ),
    )


def downgrade() -> None:
    op.drop_column('user_site_settings', 'schema_version')
