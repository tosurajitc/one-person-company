"""add related_route and unlocks_after_phase to resources

Revision ID: f5a6b7c8d9e0
Revises: ea6387773f80
Create Date: 2026-09-22

Additive only: two nullable columns on `resources`. No renames, no drops.
Existing rows get NULL for both — `related_route` NULL means "not deep-linked
from anywhere in the dashboard yet" and `unlocks_after_phase` NULL means
"visible to everyone regardless of where they are in the build journey"
(both the resource_routes.py filtering logic and the frontend treat NULL
as "always show" / "no specific feature link").
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f5a6b7c8d9e0'
down_revision = 'fb2c9d4e5a61'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('resources', sa.Column('related_route', sa.String(length=255), nullable=True))
    op.add_column('resources', sa.Column('unlocks_after_phase', sa.Integer(), nullable=True))
    op.create_index('ix_resources_unlocks_after_phase', 'resources', ['unlocks_after_phase'])


def downgrade() -> None:
    op.drop_index('ix_resources_unlocks_after_phase', table_name='resources')
    op.drop_column('resources', 'unlocks_after_phase')
    op.drop_column('resources', 'related_route')