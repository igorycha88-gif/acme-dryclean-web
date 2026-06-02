"""Create analytics tables

Revision ID: 001
Revises:
Create Date: 2026-06-01
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "analytics_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("visitor_id", sa.String(100), nullable=False),
        sa.Column("first_page_url", sa.Text(), nullable=True),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("referrer_group", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("ip_address", postgresql.INET, nullable=True),
        sa.Column("geo_city", sa.String(100), nullable=True),
        sa.Column("geo_country", sa.String(100), nullable=True),
        sa.Column("page_views_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("idx_sessions_visitor", "analytics_sessions", ["visitor_id"])
    op.create_index("idx_sessions_started", "analytics_sessions", [sa.text("started_at DESC")])
    op.create_index("idx_sessions_group", "analytics_sessions", ["referrer_group"])

    op.create_table(
        "analytics_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visitor_id", sa.String(100), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("event_name", sa.String(100), nullable=True),
        sa.Column("payload", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("page_url", sa.Text(), nullable=True),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("referrer_group", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("ip_address", postgresql.INET, nullable=True),
        sa.Column("geo_city", sa.String(100), nullable=True),
        sa.Column("geo_country", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_events_type_time", "analytics_events", ["event_type", sa.text("created_at DESC")])
    op.create_index("idx_events_session", "analytics_events", ["session_id"])
    op.create_index("idx_events_created", "analytics_events", [sa.text("created_at DESC")])
    op.create_index("idx_events_payload", "analytics_events", [sa.text("payload")], postgresql_using="gin")


def downgrade() -> None:
    op.drop_table("analytics_events")
    op.drop_table("analytics_sessions")
