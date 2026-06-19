"""add probability and ai_rationale to porter_forces

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-18 16:17:00.000000

Adds probability (1-5 relevancia) and ai_rationale columns to porter_forces
to bring Porter analysis to the same quantitative rigor as PESTEL (ISO 31000).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, Sequence[str]] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("porter_forces", sa.Column("probability", sa.Integer(), nullable=True))
    op.add_column("porter_forces", sa.Column("ai_rationale", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("porter_forces", "ai_rationale")
    op.drop_column("porter_forces", "probability")
