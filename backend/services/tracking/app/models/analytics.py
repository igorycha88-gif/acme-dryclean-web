import uuid

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.sql import func

from app.models.base import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(PG_UUID, primary_key=True, default=uuid.uuid4)
    session_id = Column(PG_UUID, nullable=False, index=True)
    visitor_id = Column(String(100), nullable=False)
    event_type = Column(String(50), nullable=False, index=True)
    event_name = Column(String(100), nullable=True)
    payload = Column(JSON, nullable=False, default=dict)
    page_url = Column(Text, nullable=True)
    referrer = Column(Text, nullable=True)
    referrer_group = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    geo_city = Column(String(100), nullable=True)
    geo_country = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)


class AnalyticsSession(Base):
    __tablename__ = "analytics_sessions"

    id = Column(PG_UUID, primary_key=True, default=uuid.uuid4)
    session_id = Column(PG_UUID, unique=True, nullable=False)
    visitor_id = Column(String(100), nullable=False, index=True)
    first_page_url = Column(Text, nullable=True)
    referrer = Column(Text, nullable=True)
    referrer_group = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    geo_city = Column(String(100), nullable=True)
    geo_country = Column(String(100), nullable=True)
    page_views_count = Column(Integer, nullable=False, default=1)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
