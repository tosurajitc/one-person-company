"""add_fb_agent_states_table

Revision ID: a3f9b1c2d4e5
Revises: f7e3dc7821f6
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'a3f9b1c2d4e5'
down_revision = 'f7e3dc7821f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'fb_agent_states',
        sa.Column('id',         sa.Integer(),     nullable=False),
        sa.Column('session_id', sa.String(64),    nullable=False),
        sa.Column('state_json', sa.Text(),         nullable=False, server_default='{}'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_fb_agent_states_id',         'fb_agent_states', ['id'],         unique=False)
    op.create_index('ix_fb_agent_states_session_id', 'fb_agent_states', ['session_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_fb_agent_states_session_id', table_name='fb_agent_states')
    op.drop_index('ix_fb_agent_states_id',         table_name='fb_agent_states')
    op.drop_table('fb_agent_states')
