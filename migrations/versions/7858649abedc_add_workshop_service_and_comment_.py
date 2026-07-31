"""add workshop service and comment improvements

Revision ID: 7858649abedc
Revises: 497426396169
Create Date: 2026-07-30 13:48:19.089375

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "7858649abedc"
down_revision = "497426396169"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("customers", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

    with op.batch_alter_table(
        "password_reset_tokens",
        schema=None
    ) as batch_op:
        batch_op.alter_column(
            "expires_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            existing_nullable=False
        )

        batch_op.alter_column(
            "used_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            existing_nullable=True
        )

        batch_op.alter_column(
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

    with op.batch_alter_table(
        "service_comments",
        schema=None
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=True
            )
        )

        batch_op.alter_column(
            "employee_id",
            existing_type=sa.INTEGER(),
            nullable=False
        )

        batch_op.alter_column(
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

        batch_op.drop_constraint(
            batch_op.f("service_comments_service_id_fkey"),
            type_="foreignkey"
        )

        batch_op.create_foreign_key(
            "fk_service_comments_service_id_services",
            "services",
            ["service_id"],
            ["id"],
            ondelete="CASCADE"
        )

    with op.batch_alter_table(
        "service_status_logs",
        schema=None
    ) as batch_op:
        batch_op.alter_column(
            "changed_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

        batch_op.drop_constraint(
            batch_op.f("service_status_logs_service_id_fkey"),
            type_="foreignkey"
        )

        batch_op.create_foreign_key(
            "fk_service_status_logs_service_id_services",
            "services",
            ["service_id"],
            ["id"],
            ondelete="CASCADE"
        )

    with op.batch_alter_table("services", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False
            )
        )

        batch_op.alter_column(
            "updated_at",
            existing_type=sa.DateTime(timezone=True),
            server_default=None,
            existing_nullable=False
        )

        batch_op.alter_column(
            "start_date",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

        batch_op.alter_column(
            "end_date",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            existing_nullable=True
        )

        batch_op.alter_column(
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

    with op.batch_alter_table("vehicles", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )

    with op.batch_alter_table("workshops", schema=None) as batch_op:
        batch_op.alter_column(
            "cif",
            existing_type=sa.VARCHAR(length=50),
            nullable=True
        )

        batch_op.alter_column(
            "created_at",
            existing_type=postgresql.TIMESTAMP(),
            type_=sa.DateTime(timezone=True),
            nullable=False
        )


def downgrade():
    with op.batch_alter_table("workshops", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

        batch_op.alter_column(
            "cif",
            existing_type=sa.VARCHAR(length=50),
            nullable=False
        )

    with op.batch_alter_table("vehicles", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

    with op.batch_alter_table("services", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

        batch_op.alter_column(
            "end_date",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            existing_nullable=True
        )

        batch_op.alter_column(
            "start_date",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

        batch_op.drop_column("updated_at")

    with op.batch_alter_table(
        "service_status_logs",
        schema=None
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_service_status_logs_service_id_services",
            type_="foreignkey"
        )

        batch_op.create_foreign_key(
            batch_op.f("service_status_logs_service_id_fkey"),
            "services",
            ["service_id"],
            ["id"]
        )

        batch_op.alter_column(
            "changed_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

    with op.batch_alter_table(
        "service_comments",
        schema=None
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_service_comments_service_id_services",
            type_="foreignkey"
        )

        batch_op.create_foreign_key(
            batch_op.f("service_comments_service_id_fkey"),
            "services",
            ["service_id"],
            ["id"]
        )

        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

        batch_op.alter_column(
            "employee_id",
            existing_type=sa.INTEGER(),
            nullable=True
        )

        batch_op.drop_column("updated_at")

    with op.batch_alter_table(
        "password_reset_tokens",
        schema=None
    ) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

        batch_op.alter_column(
            "used_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            existing_nullable=True
        )

        batch_op.alter_column(
            "expires_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            existing_nullable=False
        )

    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )

    with op.batch_alter_table("customers", schema=None) as batch_op:
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DateTime(timezone=True),
            type_=postgresql.TIMESTAMP(),
            nullable=True
        )