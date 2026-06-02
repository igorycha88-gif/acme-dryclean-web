from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.analytics import AnalyticsEvent, AnalyticsSession
from app.models.base import Base
from app.schemas.event import EventCreate
from app.services.analytics import AnalyticsService, classify_referrer

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_tracking.db"


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.mark.asyncio
async def test_record_page_view_event(db_session):
    service = AnalyticsService(db_session)
    event = EventCreate(
        session_id=uuid4(),
        visitor_id="test-visitor-1",
        event_type="page_view",
        page_url="https://da-dryclean.ru/",
        referrer="https://yandex.ru/search/",
    )
    record = await service.record_event(event, ip_address="127.0.0.1", user_agent="TestAgent/1.0")
    assert record.event_type == "page_view"
    assert record.visitor_id == "test-visitor-1"
    assert record.referrer_group == "organic:yandex"
    assert record.geo_city is None


@pytest.mark.asyncio
async def test_record_service_click_event(db_session):
    service = AnalyticsService(db_session)
    event = EventCreate(
        session_id=uuid4(),
        visitor_id="test-visitor-2",
        event_type="service_click",
        payload={"service_slug": "himchistka-divanov", "service_name": "Химчистка диванов"},
    )
    record = await service.record_event(event)
    assert record.event_type == "service_click"
    assert record.payload["service_slug"] == "himchistka-divanov"


@pytest.mark.asyncio
async def test_record_phone_click_event(db_session):
    service = AnalyticsService(db_session)
    event = EventCreate(
        session_id=uuid4(),
        visitor_id="test-visitor-3",
        event_type="phone_click",
        payload={"phone": "+74952261573"},
    )
    record = await service.record_event(event)
    assert record.event_type == "phone_click"
    assert record.payload["phone"] == "+74952261573"


@pytest.mark.asyncio
async def test_record_messenger_click_event(db_session):
    service = AnalyticsService(db_session)
    event = EventCreate(
        session_id=uuid4(),
        visitor_id="test-visitor-4",
        event_type="messenger_click",
        payload={"messenger": "telegram"},
    )
    record = await service.record_event(event)
    assert record.event_type == "messenger_click"
    assert record.payload["messenger"] == "telegram"


@pytest.mark.asyncio
async def test_record_form_submit_event(db_session):
    service = AnalyticsService(db_session)
    event = EventCreate(
        session_id=uuid4(),
        visitor_id="test-visitor-5",
        event_type="form_submit",
        payload={"form_location": "hero", "service_type": "himchistka-divanov", "success": True},
    )
    record = await service.record_event(event)
    assert record.event_type == "form_submit"
    assert record.payload["success"] is True


@pytest.mark.asyncio
async def test_session_creation(db_session):
    service = AnalyticsService(db_session)
    session_id = uuid4()
    event = EventCreate(
        session_id=session_id,
        visitor_id="test-visitor-6",
        event_type="page_view",
        page_url="/",
    )
    await service.record_event(event)
    await db_session.flush()
    result = await db_session.execute(
        select(AnalyticsSession).where(AnalyticsSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    assert session is not None
    assert session.visitor_id == "test-visitor-6"
    assert session.page_views_count == 1


@pytest.mark.asyncio
async def test_stats_aggregation(db_session):
    service = AnalyticsService(db_session)
    sid = uuid4()
    events = [
        EventCreate(session_id=sid, visitor_id="v1", event_type="page_view", page_url="/"),
        EventCreate(session_id=sid, visitor_id="v1", event_type="page_view", page_url="/uslugi"),
    ]
    for e in events:
        await service.record_event(e)
    await db_session.commit()

    result = await db_session.execute(
        select(AnalyticsEvent).where(AnalyticsEvent.event_type == "page_view")
    )
    page_events = result.scalars().all()
    assert len(page_events) == 2


def test_classify_referrer_direct():
    assert classify_referrer(None) == "direct"
    assert classify_referrer("") == "direct"


def test_classify_referrer_organic():
    assert classify_referrer("https://yandex.ru/search/?text=test") == "organic:yandex"
    assert classify_referrer("https://google.com/search?q=test") == "organic:google"


def test_classify_referrer_social():
    assert classify_referrer("https://t.me/some_link") == "social:telegram"
    assert classify_referrer("https://vk.com/wall-123") == "social:vk"


def test_classify_referrer_other():
    assert classify_referrer("https://example.com") == "other"
