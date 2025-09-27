"""add phone number to user"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20240705_0002"
down_revision = "20240705_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user", sa.Column("phone_number", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("user", "phone_number")
