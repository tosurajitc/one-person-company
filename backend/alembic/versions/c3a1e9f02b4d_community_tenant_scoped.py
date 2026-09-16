"""community_tenant_scoped

Rearchitects the community tables from a global singleton into per-founder
tenant-scoped entities (Skool-style).

Changes:
  1. Add "community" value to offertype enum
  2. Add community_status enum
  3. Create communities table
  4. Create community_templates table
  5. Drop all legacy global community rows (decision: delete test data)
  6. Drop & recreate community_settings with community_id FK + 1:1 unique
  7. Add community_id to community_threads, community_events
  8. Drop old unique constraint on community_members.user_id;
     add community_id FK + (community_id, user_id) unique constraint;
     add joined_via_payment_id FK

Revision ID: c3a1e9f02b4d
Revises: b9e4dc8910ab
Create Date: 2026-09-16 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c3a1e9f02b4d'
down_revision: Union[str, None] = 'b9e4dc8910ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Extend offertype enum with "community"
    # ------------------------------------------------------------------
    op.execute("ALTER TYPE offertype ADD VALUE IF NOT EXISTS 'community'")

    # ------------------------------------------------------------------
    # 2. Create community_status enum
    # ------------------------------------------------------------------
    community_status = postgresql.ENUM(
        'draft', 'active', 'archived', name='community_status', create_type=False
    )
    community_status.create(op.get_bind(), checkfirst=True)

    # ------------------------------------------------------------------
    # 3. Create communities table
    # ------------------------------------------------------------------
    op.create_table(
        'communities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('offer_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_template', sa.String(100), nullable=True),
        sa.Column('status', sa.Enum('draft', 'active', 'archived', name='community_status'), nullable=False, server_default='draft'),
        sa.Column('branding', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['offer_id'], ['offers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('offer_id'),
        sa.UniqueConstraint('owner_id', 'slug', name='uq_community_owner_slug'),
    )
    op.create_index('ix_communities_id', 'communities', ['id'], unique=False)
    op.create_index('ix_communities_owner_id', 'communities', ['owner_id'], unique=False)

    # ------------------------------------------------------------------
    # 4. Create community_templates table
    # ------------------------------------------------------------------
    op.create_table(
        'community_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('categories', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('feature_flags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_index('ix_community_templates_id', 'community_templates', ['id'], unique=False)

    # ------------------------------------------------------------------
    # 5. Delete all legacy global community rows (decision: test data only)
    # ------------------------------------------------------------------
    op.execute("DELETE FROM community_posts")
    op.execute("DELETE FROM community_threads")
    op.execute("DELETE FROM community_members")
    op.execute("DELETE FROM community_events")
    op.execute("DELETE FROM community_settings")

    # ------------------------------------------------------------------
    # 6. Rebuild community_settings with community_id (was global singleton)
    # ------------------------------------------------------------------
    # Drop old columns that no longer exist in new schema
    op.drop_column('community_settings', 'welcome_message')
    op.drop_column('community_settings', 'rules')
    op.drop_column('community_settings', 'categories')
    op.drop_column('community_settings', 'features_enabled')
    op.drop_column('community_settings', 'stats_override')
    op.drop_column('community_settings', 'updated_at')

    # Add new columns
    op.add_column('community_settings',
        sa.Column('community_id', sa.Integer(), nullable=False))
    op.add_column('community_settings',
        sa.Column('welcome_message', sa.Text(), nullable=True, server_default='Welcome to the community!'))
    op.add_column('community_settings',
        sa.Column('rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('community_settings',
        sa.Column('categories', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('community_settings',
        sa.Column('features_enabled', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('community_settings',
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

    op.create_foreign_key(
        'fk_community_settings_community_id',
        'community_settings', 'communities', ['community_id'], ['id'],
        ondelete='CASCADE',
    )
    op.create_unique_constraint('uq_community_settings_community_id', 'community_settings', ['community_id'])
    op.create_index('ix_community_settings_community_id', 'community_settings', ['community_id'], unique=True)

    # ------------------------------------------------------------------
    # 7a. Add community_id to community_threads
    # ------------------------------------------------------------------
    op.add_column('community_threads',
        sa.Column('community_id', sa.Integer(), nullable=False, server_default='0'))
    # Remove the placeholder default after adding NOT NULL column on empty table
    op.alter_column('community_threads', 'community_id', server_default=None)
    op.create_foreign_key(
        'fk_community_threads_community_id',
        'community_threads', 'communities', ['community_id'], ['id'],
        ondelete='CASCADE',
    )
    op.create_index('ix_community_threads_community_id', 'community_threads', ['community_id'], unique=False)

    # ------------------------------------------------------------------
    # 7b. Add community_id to community_events
    # ------------------------------------------------------------------
    op.add_column('community_events',
        sa.Column('community_id', sa.Integer(), nullable=False, server_default='0'))
    op.alter_column('community_events', 'community_id', server_default=None)
    op.create_foreign_key(
        'fk_community_events_community_id',
        'community_events', 'communities', ['community_id'], ['id'],
        ondelete='CASCADE',
    )
    op.create_index('ix_community_events_community_id', 'community_events', ['community_id'], unique=False)

    # ------------------------------------------------------------------
    # 8. Retrofit community_members
    # ------------------------------------------------------------------
    # Drop the old single-user unique constraint
    op.drop_constraint('community_members_user_id_key', 'community_members', type_='unique')

    # Add community_id (NOT NULL; table is empty after delete above)
    op.add_column('community_members',
        sa.Column('community_id', sa.Integer(), nullable=False, server_default='0'))
    op.alter_column('community_members', 'community_id', server_default=None)
    op.create_foreign_key(
        'fk_community_members_community_id',
        'community_members', 'communities', ['community_id'], ['id'],
        ondelete='CASCADE',
    )
    op.create_index('ix_community_members_community_id', 'community_members', ['community_id'], unique=False)

    # Add joined_via_payment_id
    op.add_column('community_members',
        sa.Column('joined_via_payment_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_community_members_payment_id',
        'community_members', 'payments', ['joined_via_payment_id'], ['id'],
        ondelete='SET NULL',
    )

    # Add new (community_id, user_id) unique constraint
    op.create_unique_constraint('uq_member_per_community', 'community_members', ['community_id', 'user_id'])

    # ------------------------------------------------------------------
    # 9. Seed built-in community templates
    # ------------------------------------------------------------------
    op.execute("""
        INSERT INTO community_templates (name, description, categories, feature_flags, created_at, updated_at)
        VALUES
        (
            'Coaching',
            'For coaches and mentors building a client community.',
            '["Announcements", "Client Wins", "Q&A", "Resources", "General"]'::jsonb,
            '{"threads": true, "events": true, "members": true}'::jsonb,
            now(), now()
        ),
        (
            'Course / Cohort',
            'For course creators running cohort-based learning.',
            '["Announcements", "Introductions", "Lesson Discussion", "Projects", "Help"]'::jsonb,
            '{"threads": true, "events": true, "members": true}'::jsonb,
            now(), now()
        ),
        (
            'Membership Site',
            'For paid membership communities with ongoing value delivery.',
            '["Announcements", "Member Spotlight", "Resources", "Feedback", "Off-Topic"]'::jsonb,
            '{"threads": true, "events": true, "members": true}'::jsonb,
            now(), now()
        )
    """)


def downgrade() -> None:
    # Remove seeds
    op.execute("DELETE FROM community_templates")

    # Revert community_members
    op.drop_constraint('uq_member_per_community', 'community_members', type_='unique')
    op.drop_constraint('fk_community_members_payment_id', 'community_members', type_='foreignkey')
    op.drop_constraint('fk_community_members_community_id', 'community_members', type_='foreignkey')
    op.drop_index('ix_community_members_community_id', table_name='community_members')
    op.drop_column('community_members', 'joined_via_payment_id')
    op.drop_column('community_members', 'community_id')
    op.create_unique_constraint('community_members_user_id_key', 'community_members', ['user_id'])

    # Revert community_events
    op.drop_constraint('fk_community_events_community_id', 'community_events', type_='foreignkey')
    op.drop_index('ix_community_events_community_id', table_name='community_events')
    op.drop_column('community_events', 'community_id')

    # Revert community_threads
    op.drop_constraint('fk_community_threads_community_id', 'community_threads', type_='foreignkey')
    op.drop_index('ix_community_threads_community_id', table_name='community_threads')
    op.drop_column('community_threads', 'community_id')

    # Revert community_settings — restore old shape (rows already gone)
    op.drop_constraint('uq_community_settings_community_id', 'community_settings', type_='unique')
    op.drop_constraint('fk_community_settings_community_id', 'community_settings', type_='foreignkey')
    op.drop_index('ix_community_settings_community_id', table_name='community_settings')
    op.drop_column('community_settings', 'community_id')
    op.drop_column('community_settings', 'welcome_message')
    op.drop_column('community_settings', 'rules')
    op.drop_column('community_settings', 'categories')
    op.drop_column('community_settings', 'features_enabled')
    op.drop_column('community_settings', 'updated_at')
    # Restore old columns
    op.add_column('community_settings',
        sa.Column('welcome_message', sa.Text(), nullable=True))
    op.add_column('community_settings',
        sa.Column('rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('community_settings',
        sa.Column('categories', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('community_settings',
        sa.Column('features_enabled', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('community_settings',
        sa.Column('stats_override', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('community_settings',
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))

    # Drop new tables
    op.drop_index('ix_community_templates_id', table_name='community_templates')
    op.drop_table('community_templates')
    op.drop_index('ix_communities_owner_id', table_name='communities')
    op.drop_index('ix_communities_id', table_name='communities')
    op.drop_table('communities')
