"""tutor_training template tables

Revision ID: t7u8v9w0x1y2
Revises: m8n9o0p1q2r3
Create Date: 2026-09-23

Adds four new, additive tables for the tutor-training template:
  tutor_subjects, tutor_videos, tutor_availability, tutor_bookings, tutor_settings

⚠️ Set `down_revision` below to whatever your actual current head is
   (run `alembic heads` first) if `m8n9o0p1q2r3` (the travel-host migration)
   is not it — this file assumes travel-host was applied most recently.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 't7u8v9w0x1y2'
down_revision = ('m8n9o0p1q2r3', 'f5a6b7c8d9e0')
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'tutor_subjects',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('founder_site_id', sa.Integer(), sa.ForeignKey('founder_sites.id', ondelete='SET NULL'), nullable=True),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=30), nullable=False, server_default='academic'),
        sa.Column('format', sa.String(length=20), nullable=False, server_default='one_on_one'),
        sa.Column('level', sa.String(length=20), nullable=False, server_default='all_levels'),
        sa.Column('age_groups', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('group_size_max', sa.Integer(), nullable=True),
        sa.Column('price', sa.Numeric(10, 2), nullable=True),
        sa.Column('trial_available', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('trial_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('package_classes', sa.Integer(), nullable=True),
        sa.Column('package_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('cover_image', sa.String(length=500), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('syllabus', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('prerequisites', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'slug', name='uq_tutor_subjects_user_slug'),
    )
    op.create_index('ix_tutor_subjects_user_status', 'tutor_subjects', ['user_id', 'status'])

    op.create_table(
        'tutor_videos',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('subject_id', sa.Integer(), sa.ForeignKey('tutor_subjects.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('youtube_video_id', sa.String(length=32), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tutor_videos_user_sort', 'tutor_videos', ['user_id', 'sort_order'])

    op.create_table(
        'tutor_availability',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('weekday', sa.SmallInteger(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tutor_availability_user_weekday', 'tutor_availability', ['user_id', 'weekday'])

    op.create_table(
        'tutor_bookings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('owner_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('subject_id', sa.Integer(), sa.ForeignKey('tutor_subjects.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('student_name', sa.String(length=200), nullable=False),
        sa.Column('phone', sa.String(length=40), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('class_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('is_trial', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('price', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='requested'),
        sa.Column('hold_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('meet_link', sa.String(length=500), nullable=True),
        sa.Column('payment_id', sa.String(length=120), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tutor_bookings_owner_date', 'tutor_bookings', ['owner_user_id', 'class_date'])
    op.create_index('ix_tutor_bookings_owner_status', 'tutor_bookings', ['owner_user_id', 'status'])

    op.create_table(
        'tutor_settings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('settings', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('tutor_settings')
    op.drop_index('ix_tutor_bookings_owner_status', table_name='tutor_bookings')
    op.drop_index('ix_tutor_bookings_owner_date', table_name='tutor_bookings')
    op.drop_table('tutor_bookings')
    op.drop_index('ix_tutor_availability_user_weekday', table_name='tutor_availability')
    op.drop_table('tutor_availability')
    op.drop_index('ix_tutor_videos_user_sort', table_name='tutor_videos')
    op.drop_table('tutor_videos')
    op.drop_index('ix_tutor_subjects_user_status', table_name='tutor_subjects')
    op.drop_table('tutor_subjects')
