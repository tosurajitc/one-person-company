"""add unique constraint on user_site_settings (user_id, key)

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2025-01-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e3f4a5b6c7d8'
down_revision = 'd2e3f4a5b6c7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Checked the live data before writing this migration: there were zero
    # existing (user_id, key) duplicates, so no cleanup/dedupe step is
    # needed here. This purely adds the constraint that was missing, so a
    # future bug can no longer save two rows for the same user + settings
    # group (e.g. two "brand" rows for the same user).
    op.create_unique_constraint(
        'uq_user_site_settings_user_id_key',
        'user_site_settings',
        ['user_id', 'key'],
    )


def downgrade() -> None:
    op.drop_constraint(
        'uq_user_site_settings_user_id_key',
        'user_site_settings',
        type_='unique',
    )