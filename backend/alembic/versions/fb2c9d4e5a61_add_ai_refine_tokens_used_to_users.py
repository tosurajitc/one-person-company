"""add ai_refine_tokens_used to users

Revision ID: fb2c9d4e5a61
Revises: ea6387773f80
Create Date: 2026-09-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'fb2c9d4e5a61'
down_revision: Union[str, None] = 'ea6387773f80'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'ai_refine_tokens_used',
            sa.Integer(),
            nullable=False,
            server_default='0',
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'ai_refine_tokens_used')
