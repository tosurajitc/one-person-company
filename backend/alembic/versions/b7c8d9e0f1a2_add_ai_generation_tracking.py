"""add ai generation tracking and ai_credit payment purpose

Revision ID: b7c8d9e0f1a2
Revises: c4d5e6f7a8b9
Create Date: 2025-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b7c8d9e0f1a2'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # Add columns to users table if not existing
    inspector = sa.inspect(conn)
    existing_cols = [c['name'] for c in inspector.get_columns('users')]
    
    if 'ai_generations_count' not in existing_cols:
        op.add_column('users', sa.Column('ai_generations_count', sa.Integer(), nullable=False, server_default='0'))
    if 'ai_generation_credits' not in existing_cols:
        op.add_column('users', sa.Column('ai_generation_credits', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('users', 'ai_generation_credits')
    op.drop_column('users', 'ai_generations_count')
