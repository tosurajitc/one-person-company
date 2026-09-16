"""add_user_site_settings_table

Revision ID: d4e5f6a7b8c9
Revises: f7e3dc7821f6
Create Date: 2026-09-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'f7e3dc7821f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_site_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_site_settings_id'), 'user_site_settings', ['id'], unique=False)
    op.create_index(op.f('ix_user_site_settings_user_id'), 'user_site_settings', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_site_settings_key'), 'user_site_settings', ['key'], unique=False)
    # Composite unique constraint: one row per (user, key)
    op.create_unique_constraint('uq_user_site_settings_user_key', 'user_site_settings', ['user_id', 'key'])


def downgrade() -> None:
    op.drop_constraint('uq_user_site_settings_user_key', 'user_site_settings', type_='unique')
    op.drop_index(op.f('ix_user_site_settings_key'), table_name='user_site_settings')
    op.drop_index(op.f('ix_user_site_settings_user_id'), table_name='user_site_settings')
    op.drop_index(op.f('ix_user_site_settings_id'), table_name='user_site_settings')
    op.drop_table('user_site_settings')
