"""add founder_sites table and slug history

Revision ID: c4d5e6f7a8b9
Revises: f1a2b3c4d5e6
Create Date: 2025-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c4d5e6f7a8b9'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # founder_sites: one row per founder's public website.
    # user_id is unique -- each founder has exactly one site.
    # slug is unique -- this is the public address, e.g. /jane-doe-studio.
    op.create_table(
        'founder_sites',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column('slug', sa.String(100), nullable=False, unique=True, index=True),
        sa.Column(
            'theme',
            sa.String(50),
            nullable=False,
            server_default='professional',
        ),
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            server_default='draft',
        ),
        sa.Column('custom_domain', sa.String(255), nullable=True, unique=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # founder_site_slug_history: every slug a site used to have.
    # When a founder changes their site's slug, the old slug moves here so
    # the old public URL can 301-redirect to the new one, and so
    # reserved_names.py can block anyone else from claiming a slug that
    # used to belong to someone else.
    op.create_table(
        'founder_site_slug_history',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'founder_site_id',
            sa.Integer(),
            sa.ForeignKey('founder_sites.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('old_slug', sa.String(100), nullable=False, unique=True, index=True),
        sa.Column(
            'replaced_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table('founder_site_slug_history')
    op.drop_table('founder_sites')