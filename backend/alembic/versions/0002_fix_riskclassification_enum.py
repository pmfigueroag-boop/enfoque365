"""fix riskclassification enum values to UPPERCASE

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-18 14:55:00.000000

The baseline migration created the riskclassification PostgreSQL enum with
lowercase values (critico, monitoreo, bajo, sin_calificar), but SQLAlchemy's
Enum(PythonEnum) sends the .name (uppercase) by default. All other enums
already use uppercase values. This migration renames the enum values to
match SQLAlchemy's behavior.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, Sequence[str]] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename enum values from lowercase to UPPERCASE to match SQLAlchemy's
    # default behavior (sends Python enum .name which is uppercase).
    op.execute("ALTER TYPE riskclassification RENAME VALUE 'critico' TO 'CRITICO'")
    op.execute("ALTER TYPE riskclassification RENAME VALUE 'monitoreo' TO 'MONITOREO'")
    op.execute("ALTER TYPE riskclassification RENAME VALUE 'bajo' TO 'BAJO'")
    op.execute("ALTER TYPE riskclassification RENAME VALUE 'sin_calificar' TO 'SIN_CALIFICAR'")


def downgrade() -> None:
    op.execute("ALTER TYPE riskclassification RENAME VALUE 'CRITICO' TO 'critico'")
    op.execute("ALTER TYPE riskclassification RENAME VALUE 'MONITOREO' TO 'monitoreo'")
    op.execute("ALTER TYPE riskclassification RENAME VALUE 'BAJO' TO 'bajo'")
    op.execute("ALTER TYPE riskclassification RENAME VALUE 'SIN_CALIFICAR' TO 'sin_calificar'")
