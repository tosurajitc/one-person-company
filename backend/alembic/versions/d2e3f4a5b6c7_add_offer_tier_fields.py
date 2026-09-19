"""add tier fields and site link to offers

Revision ID: d2e3f4a5b6c7
Revises: 80d89c47ebd9
Create Date: 2025-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = 'd2e3f4a5b6c7'
down_revision = '80d89c47ebd9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # All columns are nullable so every existing offer row stays valid with
    # no backfill needed. These let the setup wizard's pricing-tier step
    # (Starter / Growth / Premium, etc.) map onto real Offer rows.

    # Which pricing tier this offer represents, e.g. "starter", "growth",
    # "premium". Free text rather than an enum, since tier names are
    # user-defined in the wizard, not fixed by the platform.
    op.add_column(
        'offers',
        sa.Column('tier', sa.String(50), nullable=True),
    )

    # A USD-normalized price, kept alongside the existing `price` /
    # `currency` columns so tiers can be compared/sorted across founders
    # who price in different currencies.
    op.add_column(
        'offers',
        sa.Column('price_usd', sa.Numeric(10, 2), nullable=True),
    )

    # What's included in this tier, e.g. ["1 landing page", "Email support"].
    # Stored as JSONB so the wizard can save a list without a separate table.
    op.add_column(
        'offers',
        sa.Column('deliverables', JSONB(), nullable=True),
    )

    # Marks the tier the wizard should visually highlight as "most bought" /
    # recommended on the public offers page. Defaults to false so existing
    # rows and new rows are never ambiguously NULL for a plain yes/no flag.
    op.add_column(
        'offers',
        sa.Column(
            'is_highlighted',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # Display order among a founder's tiers on their offers page. Defaults
    # to 0 so existing rows sort predictably instead of landing as NULL.
    op.add_column(
        'offers',
        sa.Column(
            'sort_order',
            sa.Integer(),
            nullable=False,
            server_default='0',
        ),
    )

    # Which founder_sites row this offer belongs to. Nullable because
    # offers created before a founder has a site (or offers unrelated to
    # the site builder) simply won't have one.
    op.add_column(
        'offers',
        sa.Column(
            'founder_site_id',
            sa.Integer(),
            sa.ForeignKey('founder_sites.id', ondelete='CASCADE'),
            nullable=True,
        ),
    )
    op.create_index(
        'ix_offers_founder_site_id',
        'offers',
        ['founder_site_id'],
    )


def downgrade() -> None:
    op.drop_index('ix_offers_founder_site_id', table_name='offers')
    op.drop_column('offers', 'founder_site_id')
    op.drop_column('offers', 'sort_order')
    op.drop_column('offers', 'is_highlighted')
    op.drop_column('offers', 'deliverables')
    op.drop_column('offers', 'price_usd')
    op.drop_column('offers', 'tier')