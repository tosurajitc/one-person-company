"""merge migration heads before founder_sites

Revision ID: 80d89c47ebd9
Revises: a1b2c3d4e5f6, a3f9b1c2d4e5, c3a1e9f02b4d, c4d5e6f7a8b9, e5f6a7b8c9d0
Create Date: 2026-09-18 17:59:23.514187

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '80d89c47ebd9'
down_revision: Union[str, None] = ('a1b2c3d4e5f6', 'a3f9b1c2d4e5', 'c3a1e9f02b4d', 'c4d5e6f7a8b9', 'e5f6a7b8c9d0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
