"""add user_ai_credentials and ad_management_states

Revision ID: ea6387773f80
Revises: l7m8n9o0p1q2
Create Date: 2026-09-22 10:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ea6387773f80'
down_revision: Union[str, None] = 'l7m8n9o0p1q2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely create enum types if not exists
    bind = op.get_bind()
    bind.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aiprovidertype') THEN
                CREATE TYPE aiprovidertype AS ENUM ('PLATFORM', 'GROQ', 'ANTHROPIC', 'OPENAI', 'OPENROUTER');
            END IF;
        END $$;
    """))

    bind.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stepverificationstatus') THEN
                CREATE TYPE stepverificationstatus AS ENUM ('DRAFT', 'VERIFIED', 'APPLIED', 'ARCHIVED');
            END IF;
        END $$;
    """))

    # 1. Create user_ai_credentials table
    op.create_table(
        'user_ai_credentials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', postgresql.ENUM('PLATFORM', 'GROQ', 'ANTHROPIC', 'OPENAI', 'OPENROUTER', name='aiprovidertype', create_type=False), nullable=False, server_default='PLATFORM'),
        sa.Column('encrypted_api_key', sa.Text(), nullable=True),
        sa.Column('key_hint', sa.String(length=32), nullable=True),
        sa.Column('custom_model_name', sa.String(length=128), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_ai_credentials_id'), 'user_ai_credentials', ['id'], unique=False)
    op.create_index(op.f('ix_user_ai_credentials_user_id'), 'user_ai_credentials', ['user_id'], unique=True)

    # 2. Create ad_management_states table
    op.create_table(
        'ad_management_states',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.String(length=64), nullable=False, server_default='product-commerce'),
        sa.Column('niche_name', sa.String(length=128), nullable=False, server_default='D2C Apparel & Fashion'),
        sa.Column('monthly_ad_spend', sa.String(length=64), nullable=True),
        
        # Tier 1 Audit
        sa.Column('audit_status', postgresql.ENUM('DRAFT', 'VERIFIED', 'APPLIED', 'ARCHIVED', name='stepverificationstatus', create_type=False), nullable=False, server_default='DRAFT'),
        sa.Column('audit_score', sa.Integer(), nullable=True),
        sa.Column('audit_findings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('audit_action_plan', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('audit_verified_at', sa.DateTime(timezone=True), nullable=True),

        # Tier 2 Tracking Blueprint
        sa.Column('tracking_status', postgresql.ENUM('DRAFT', 'VERIFIED', 'APPLIED', 'ARCHIVED', name='stepverificationstatus', create_type=False), nullable=False, server_default='DRAFT'),
        sa.Column('pixel_id', sa.String(length=64), nullable=True),
        sa.Column('capi_configured', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('event_mapping', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('funnel_architecture', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('tracking_verified_at', sa.DateTime(timezone=True), nullable=True),

        # Tier 3 Creatives
        sa.Column('creative_status', postgresql.ENUM('DRAFT', 'VERIFIED', 'APPLIED', 'ARCHIVED', name='stepverificationstatus', create_type=False), nullable=False, server_default='DRAFT'),
        sa.Column('generated_copies', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('creatives_verified_at', sa.DateTime(timezone=True), nullable=True),

        # Tier 4 Diagnostics & Rules
        sa.Column('diagnostics_status', postgresql.ENUM('DRAFT', 'VERIFIED', 'APPLIED', 'ARCHIVED', name='stepverificationstatus', create_type=False), nullable=False, server_default='DRAFT'),
        sa.Column('performance_metrics', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('active_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('diagnostics_verified_at', sa.DateTime(timezone=True), nullable=True),

        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ad_management_states_id'), 'ad_management_states', ['id'], unique=False)
    op.create_index(op.f('ix_ad_management_states_user_id'), 'ad_management_states', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_ad_management_states_user_id'), table_name='ad_management_states')
    op.drop_index(op.f('ix_ad_management_states_id'), table_name='ad_management_states')
    op.drop_table('ad_management_states')

    op.drop_index(op.f('ix_user_ai_credentials_user_id'), table_name='user_ai_credentials')
    op.drop_index(op.f('ix_user_ai_credentials_id'), table_name='user_ai_credentials')
    op.drop_table('user_ai_credentials')

    sa.Enum(name='stepverificationstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='aiprovidertype').drop(op.get_bind(), checkfirst=True)
