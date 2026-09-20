"""add template_slug to user_site_settings

Revision ID: g2h3i4j5k6l7
Revises: f1a2b3c4d5e6
Create Date: 2025-01-01 00:00:00.000000

Adds two columns to user_site_settings so the selected template is persisted
independently of the JSONB value blob:
  - template_slug    VARCHAR(100)  — e.g. 'clinic-practitioner'
  - template_section VARCHAR(100)  — e.g. 'local-trade'

Both are nullable because existing rows pre-date template selection.
The JSONB 'template' and 'template_data' keys are stored as normal rows
alongside the other wizard groups; these columns are denormalised copies
kept on all rows belonging to the 'template' key for fast backend queries.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'g2h3i4j5k6l7'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'user_site_settings',
        sa.Column('template_slug', sa.String(100), nullable=True),
    )
    op.add_column(
        'user_site_settings',
        sa.Column('template_section', sa.String(100), nullable=True),
    )
    # Index for fast per-user template lookups
    op.create_index(
        'ix_user_site_settings_template_slug',
        'user_site_settings',
        ['user_id', 'template_slug'],
    )


def downgrade() -> None:
    op.drop_index('ix_user_site_settings_template_slug', table_name='user_site_settings')
    op.drop_column('user_site_settings', 'template_section')
    op.drop_column('user_site_settings', 'template_slug')
