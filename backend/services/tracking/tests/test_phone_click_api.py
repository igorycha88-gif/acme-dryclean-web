import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.models.analytics import AnalyticsEvent
from app.models.base import Base
from app.schemas.event import EventCreate

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


def event_payload(**overrides) -> dict:
    payload = {
        "session_id": str(uuid.uuid4()),
        "visitor_id": "visitor-1",
        "event_type": "click_phone",
        "event_name": "click_phone",
        "payload": {"phone": "+74952261573"},
        "page_url": "https://da-dryclean.ru/",
    }
    payload.update(overrides)
    return payload


def test_event_create_accepts_click_phone():
    event = EventCreate(**event_payload())
    assert event.event_type == "click_phone"
    assert event.payload["phone"] == "+74952261573"


def test_event_create_rejects_unknown_event_type():
    with pytest.raises(ValidationError):
        EventCreate(**event_payload(event_type="tel_click"))


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def app_client(db_engine, monkeypatch):
    factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    from app.main import app

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, factory
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_track_event_click_phone_persisted_with_created_at(app_client):
    client, factory = app_client

    response = await client.post("/api/v1/tracking/event", json=event_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    event_id = body["data"]["event_id"]

    async with factory() as db:
        row = await db.get(AnalyticsEvent, uuid.UUID(event_id))
        assert row is not None
        assert row.event_type == "click_phone"
        assert row.payload["phone"] == "+74952261573"
        # AC1: точный created_at в БД (server-side timestamp)
        assert row.created_at is not None


@pytest.mark.asyncio
async def test_track_batch_accepts_click_phone(app_client):
    client, factory = app_client
    batch = {"events": [event_payload(), event_payload(event_type="page_view")]}

    response = await client.post("/api/v1/tracking/events/batch", json=batch)

    assert response.status_code == 200
    assert response.json()["data"]["processed"] == 2


@pytest.mark.asyncio
async def test_metrics_scrape_creates_no_duplicate_events(app_client):
    client, factory = app_client

    await client.post("/api/v1/tracking/event", json=event_payload())
    before = 0
    async with factory() as db:
        rows = (await db.execute(
            AnalyticsEvent.__table__.select().where(
                AnalyticsEvent.__table__.c.event_type == "click_phone"
            )
        )).all()
        before = len(rows)
    assert before == 1

    # AC5: повторные запросы эндпоинтов метрик не создают дублей событий
    for _ in range(3):
        metrics = await client.get("/metrics")
        assert metrics.status_code == 200

    async with factory() as db:
        rows = (await db.execute(
            AnalyticsEvent.__table__.select().where(
                AnalyticsEvent.__table__.c.event_type == "click_phone"
            )
        )).all()
        assert len(rows) == 1


@pytest.mark.asyncio
async def test_stats_counts_click_phone(app_client):
    client, factory = app_client

    response = await client.post("/api/v1/tracking/event", json=event_payload())
    assert response.status_code == 200

    stats = await client.get("/api/v1/tracking/stats?period=24h")
    assert stats.status_code == 200
    phone_clicks = stats.json()["data"]["phone_clicks"]
    assert phone_clicks.get("+74952261573") == 1


@pytest.mark.asyncio
async def test_stats_counts_phone_click_mix_click_phone_and_legacy(app_client):
    client, factory = app_client

    await client.post("/api/v1/tracking/event", json=event_payload())
    await client.post("/api/v1/tracking/event", json=event_payload(event_type="phone_click"))

    stats = await client.get("/api/v1/tracking/stats?period=24h")
    assert stats.status_code == 200
    phone_clicks = stats.json()["data"]["phone_clicks"]
    assert phone_clicks.get("+74952261573") == 2
