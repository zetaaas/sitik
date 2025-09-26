"""initial schema

Revision ID: 20240705_0001
Revises: 
Create Date: 2024-07-05 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from geoalchemy2.types import Geometry

# revision identifiers, used by Alembic.
revision = "20240705_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role = sa.Enum("guest", "volunteer", "moderator", "admin", name="userrole")
    volunteer_status = sa.Enum("pending", "approved", "banned", name="volunteerstatus")
    project_status = sa.Enum("draft", "pending", "approved", "rejected", name="projectstatus")
    stage_status = sa.Enum("draft", "pending", "published", "rejected", name="stagestatus")
    moderation_status = sa.Enum("pending", "approved", "rejected", "returned", name="moderationstatus")
    moderation_target = sa.Enum("project", "project_stage", "project_file", "comment", "live_question", name="moderationtarget")

    user_role.create(op.get_bind())
    volunteer_status.create(op.get_bind())
    project_status.create(op.get_bind())
    stage_status.create(op.get_bind())
    moderation_status.create(op.get_bind())
    moderation_target.create(op.get_bind())

    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("role", user_role, nullable=False, server_default="volunteer"),
        sa.Column("volunteer_status", volunteer_status, nullable=False, server_default="pending"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("iin_hash", sa.String(), nullable=True),
        sa.Column("iin_encrypted", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)
    op.create_index(op.f("ix_user_id"), "user", ["id"], unique=False)

    op.create_table(
        "project",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", project_status, nullable=False, server_default="pending"),
        sa.Column("geo_point", Geometry(geometry_type="POINT", srid=4326), nullable=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_id"), "project", ["id"], unique=False)

    op.create_table(
        "livesession",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(), nullable=False),
        sa.Column("conference_id", sa.String(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["user.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_livesession_id"), "livesession", ["id"], unique=False)

    op.create_table(
        "auditlog",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("entity", sa.String(), nullable=False),
        sa.Column("payload", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_auditlog_id"), "auditlog", ["id"], unique=False)

    op.create_table(
        "moderationitem",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("target_type", moderation_target, nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=False),
        sa.Column("status", moderation_status, nullable=False, server_default="pending"),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("reviewer_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["reviewer_id"], ["user.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_moderationitem_id"), "moderationitem", ["id"], unique=False)

    op.create_table(
        "projectstage",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_draft", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("status", stage_status, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projectstage_id"), "projectstage", ["id"], unique=False)

    op.create_table(
        "projectfile",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("minio_key", sa.String(), nullable=False),
        sa.Column("quarantine", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("thumbnail_key", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projectfile_id"), "projectfile", ["id"], unique=False)

    op.create_table(
        "livequestion",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["author_id"], ["user.id"], ),
        sa.ForeignKeyConstraint(["session_id"], ["livesession.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_livequestion_id"), "livequestion", ["id"], unique=False)

    op.create_table(
        "livetask",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("assignee_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["assignee_id"], ["user.id"], ),
        sa.ForeignKeyConstraint(["session_id"], ["livesession.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_livetask_id"), "livetask", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_livetask_id"), table_name="livetask")
    op.drop_table("livetask")
    op.drop_index(op.f("ix_livequestion_id"), table_name="livequestion")
    op.drop_table("livequestion")
    op.drop_index(op.f("ix_projectfile_id"), table_name="projectfile")
    op.drop_table("projectfile")
    op.drop_index(op.f("ix_projectstage_id"), table_name="projectstage")
    op.drop_table("projectstage")
    op.drop_index(op.f("ix_moderationitem_id"), table_name="moderationitem")
    op.drop_table("moderationitem")
    op.drop_index(op.f("ix_auditlog_id"), table_name="auditlog")
    op.drop_table("auditlog")
    op.drop_index(op.f("ix_livesession_id"), table_name="livesession")
    op.drop_table("livesession")
    op.drop_index(op.f("ix_project_id"), table_name="project")
    op.drop_table("project")
    op.drop_index(op.f("ix_user_id"), table_name="user")
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.drop_table("user")

    sa.Enum(name="moderationtarget").drop(op.get_bind())
    sa.Enum(name="moderationstatus").drop(op.get_bind())
    sa.Enum(name="stagestatus").drop(op.get_bind())
    sa.Enum(name="projectstatus").drop(op.get_bind())
    sa.Enum(name="volunteerstatus").drop(op.get_bind())
    sa.Enum(name="userrole").drop(op.get_bind())
