"""add enquiries table for AI sales desk

Revision ID: l7m8n9o0p1q2
Revises: k6l7m8n9o0p1
Create Date: 2026-09-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'l7m8n9o0p1q2'
down_revision = 'k6l7m8n9o0p1'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'enquiries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('founder_site_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('business', sa.String(length=255), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=True, server_default='website_form'),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, server_default='new'),
        sa.Column('ai_qualification', sa.Text(), nullable=True),
        sa.Column('ai_matched_offer', sa.String(length=255), nullable=True),
        sa.Column('ai_draft_reply', sa.Text(), nullable=True),
        sa.Column('approved_by_founder', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('reply_sent_at', sa.DateTime(), nullable=True),
        sa.Column('sent_reply_content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['founder_site_id'], ['founder_sites.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_enquiries_id'), 'enquiries', ['id'], unique=False)
    op.create_index(op.f('ix_enquiries_email'), 'enquiries', ['email'], unique=False)
    op.create_index(op.f('ix_enquiries_user_id'), 'enquiries', ['user_id'], unique=False)
    op.create_index(op.f('ix_enquiries_status'), 'enquiries', ['status'], unique=False)
    op.create_index(op.f('ix_enquiries_created_at'), 'enquiries', ['created_at'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_enquiries_created_at'), table_name='enquiries')
    op.drop_index(op.f('ix_enquiries_status'), table_name='enquiries')
    op.drop_index(op.f('ix_enquiries_user_id'), table_name='enquiries')
    op.drop_index(op.f('ix_enquiries_email'), table_name='enquiries')
    op.drop_index(op.f('ix_enquiries_id'), table_name='enquiries')
    op.drop_table('enquiries')
