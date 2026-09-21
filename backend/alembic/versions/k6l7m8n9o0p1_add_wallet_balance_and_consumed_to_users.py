"""add wallet_balance and wallet_consumed to users

Revision ID: k6l7m8n9o0p1
Revises: j5k6l7m8n9o0
Create Date: 2026-04-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'k6l7m8n9o0p1'
down_revision = 'j5k6l7m8n9o0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('users')]

    if 'wallet_balance' not in existing_cols:
        op.add_column('users', sa.Column('wallet_balance', sa.Numeric(10, 2), nullable=False, server_default='0.00'))

    if 'wallet_consumed' not in existing_cols:
        op.add_column('users', sa.Column('wallet_consumed', sa.Numeric(10, 2), nullable=False, server_default='0.00'))


def downgrade() -> None:
    op.drop_column('users', 'wallet_balance')
    op.drop_column('users', 'wallet_consumed')
