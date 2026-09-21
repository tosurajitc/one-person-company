"""add referral_code and referred_by_code to users

Revision ID: j5k6l7m8n9o0
Revises: i4j5k6l7m8n9
Create Date: 2026-04-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'j5k6l7m8n9o0'
down_revision = 'i4j5k6l7m8n9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('users')]

    if 'referral_code' not in existing_cols:
        op.add_column('users', sa.Column('referral_code', sa.String(20), nullable=True))
        op.create_index('ix_users_referral_code', 'users', ['referral_code'], unique=True)

    if 'referred_by_code' not in existing_cols:
        op.add_column('users', sa.Column('referred_by_code', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_index('ix_users_referral_code', table_name='users')
    op.drop_column('users', 'referral_code')
    op.drop_column('users', 'referred_by_code')
