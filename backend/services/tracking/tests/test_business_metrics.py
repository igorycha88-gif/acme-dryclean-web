import uuid
from datetime import UTC, datetime, timedelta

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from prometheus_client import generate_latest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.analytics import AnalyticsEvent, AnalyticsSession
from app.models.base import Base
from app.tasks.business_metrics import (
    business_collector,
    collect_business_metrics,
    top_n_samples,
)

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
FROZEN_NOW = datetime(2026, 8, 18, 12, 0, 0, tzinfo=UTC)


class FrozenDatetime(datetime):
    @classmethod
    def now(cls, tz=None):
        return FROZEN_NOW if tz is not None else FROZEN_NOW.replace(tzinfo=None)


def hours_ago(hours: float) -> datetime:
    return FROZEN_NOW - timedelta(hours=hours)


def make_event(session_id, visitor_id, event_type, created_at, *, geo_city=None,
               payload=None, event_name=None) -> AnalyticsEvent:
    return AnalyticsEvent(
        id=uuid.uuid4(),
        session_id=session_id,
        visitor_id=visitor_id,
        event_type=event_type,
        event_name=event_name,
        payload=payload or {},
        geo_city=geo_city,
        created_at=created_at,
    )


def make_session(session_id, visitor_id, *, started_at, last_activity_at, duration, page_views,
                 referrer_group=None) -> AnalyticsSession:
    return AnalyticsSession(
        id=uuid.uuid4(),
        session_id=session_id,
        visitor_id=visitor_id,
        referrer_group=referrer_group,
        page_views_count=page_views,
        started_at=started_at,
        last_activity_at=last_activity_at,
        duration_seconds=duration,
    )


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def seeded_db(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    s1, s2, s3 = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()

    db_session.add(make_session(s1, "v1", started_at=hours_ago(2), last_activity_at=hours_ago(10 / 60),
                                duration=600, page_views=3, referrer_group="organic:yandex"))
    db_session.add(make_session(s2, "v2", started_at=hours_ago(3), last_activity_at=hours_ago(3),
                                duration=0, page_views=1))
    db_session.add(make_session(s3, "v3", started_at=hours_ago(30), last_activity_at=hours_ago(30),
                                duration=0, page_views=1))

    events = [
        make_event(s1, "v1", "page_view", hours_ago(2), geo_city="Москва"),
        make_event(s1, "v1", "page_view", hours_ago(2), geo_city="Москва"),
        make_event(s1, "v1", "service_click", hours_ago(1.5), geo_city="Москва",
                   payload={"service_slug": "suhaya-chistka"}),
        make_event(s1, "v1", "page_view", hours_ago(0.5), geo_city="Москва"),
        make_event(s2, "v2", "page_view", hours_ago(3)),
        make_event(s2, "v2", "form_submit", hours_ago(3)),
        make_event(s3, "v3", "page_view", hours_ago(30), geo_city="Казань"),
    ]
    db_session.add_all(events)
    await db_session.commit()
    return db_session


@pytest.mark.asyncio
async def test_business_metrics_formulas(seeded_db):
    data = await collect_business_metrics(seeded_db)

    assert data["business_sessions_active"] == [({}, 1.0)]
    assert data["business_page_views_24h"] == [({}, 4.0)]
    assert data["business_page_views_1h"] == [({}, 1.0)]
    assert data["business_unique_visitors_24h"] == [({}, 2.0)]
    assert data["business_sessions_24h"] == [({}, 2.0)]
    assert data["business_avg_session_duration_seconds_24h"] == [({}, 300.0)]
    assert data["business_bounce_rate_24h"] == [({}, 0.5)]
    assert data["business_leads_24h"] == [({}, 1.0)]
    assert data["business_leads_1h"] == [({}, 0.0)]
    assert data["business_conversion_rate_24h"] == [({}, 0.5)]

    events_by_type = {labels["event_type"]: value for labels, value in data["business_events_24h"]}
    assert events_by_type == {"page_view": 4.0, "service_click": 1.0, "form_submit": 1.0}

    sources = {labels["source"]: value for labels, value in data["business_referral_sources_24h"]}
    assert sources == {"organic:yandex": 1.0, "direct": 1.0}

    geo = {labels["city"]: value for labels, value in data["business_geo_visitors_24h"]}
    assert geo == {"Москва": 1.0, "unknown": 1.0}

    services = {labels["service"]: value for labels, value in data["business_service_clicks_24h"]}
    assert services == {"suhaya-chistka": 1.0}


@pytest.mark.asyncio
async def test_business_metrics_empty_db(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    data = await collect_business_metrics(db_session)

    assert data["business_sessions_active"] == [({}, 0.0)]
    assert data["business_sessions_24h"] == [({}, 0.0)]
    assert data["business_avg_session_duration_seconds_24h"] == [({}, 0.0)]
    assert data["business_bounce_rate_24h"] == [({}, 0.0)]
    assert data["business_conversion_rate_24h"] == [({}, 0.0)]
    assert data["business_events_24h"] == []
    assert data["business_geo_visitors_24h"] == []
    assert data["business_service_clicks_24h"] == []


@pytest.mark.asyncio
async def test_service_click_fallback_labels(seeded_db):
    s4 = uuid.uuid4()
    seeded_db.add(make_session(s4, "v4", started_at=hours_ago(1), last_activity_at=hours_ago(1),
                               duration=10, page_views=1))
    seeded_db.add_all([
        make_event(s4, "v4", "service_click", hours_ago(1), event_name="click-kovry"),
        make_event(s4, "v4", "service_click", hours_ago(1), payload={"service": "chistka-kovrov"}),
        make_event(s4, "v4", "service_click", hours_ago(1)),
    ])
    await seeded_db.commit()

    data = await collect_business_metrics(seeded_db)
    services = {labels["service"]: value for labels, value in data["business_service_clicks_24h"]}
    assert services == {
        "suhaya-chistka": 1.0,
        "click-kovry": 1.0,
        "chistka-kovrov": 1.0,
        "unknown": 1.0,
    }


@pytest.mark.asyncio
async def test_geo_top_n_merges_tail(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    for i in range(12):
        db_session.add(make_event(uuid.uuid4(), f"visitor-{i}", "page_view", hours_ago(1),
                                  geo_city=f"Город-{i}"))
    await db_session.commit()

    data = await collect_business_metrics(db_session)
    geo = {labels["city"]: value for labels, value in data["business_geo_visitors_24h"]}
    assert len(geo) == 11
    assert geo["other"] == 2.0


@pytest.mark.asyncio
async def test_collector_exposes_prometheus_output(seeded_db):
    data = await collect_business_metrics(seeded_db)
    business_collector.update(data)

    output = generate_latest().decode()
    assert "# HELP business_bounce_rate_24h" in output
    assert "# TYPE business_bounce_rate_24h gauge" in output
    assert "business_page_views_24h 4.0" in output
    assert 'business_geo_visitors_24h{city="Москва"} 1.0' in output
    assert 'business_service_clicks_24h{service="suhaya-chistka"} 1.0' in output


@pytest.mark.asyncio
async def test_update_once_keeps_previous_values_on_db_error(monkeypatch):
    from app.tasks import business_metrics as bm

    business_collector.update({"business_sessions_active": [({}, 7.0)]})

    class FailingFactory:
        def __call__(self):
            return self

        async def __aenter__(self):
            raise RuntimeError("db down")

        async def __aexit__(self, *args):
            return False

    monkeypatch.setattr(bm, "async_session_factory", FailingFactory())
    await bm._update_once()

    assert business_collector.snapshot() == {"business_sessions_active": [({}, 7.0)]}


@pytest.mark.asyncio
async def test_leads_count_all_lead_types(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    s = uuid.uuid4()
    db_session.add_all([
        make_event(s, "v1", "form_submit", hours_ago(2)),
        make_event(s, "v1", "phone_click", hours_ago(2)),
        make_event(s, "v1", "messenger_click", hours_ago(2)),
        make_event(s, "v1", "page_view", hours_ago(2)),
    ])
    await db_session.commit()

    data = await collect_business_metrics(db_session)
    assert data["business_leads_24h"] == [({}, 3.0)]
    assert data["business_leads_1h"] == [({}, 0.0)]


def test_top_n_samples_merges_tail():
    samples = top_n_samples({"a": 5, "b": 3, "c": 2}, "city", 2)
    assert samples == [({"city": "a"}, 5.0), ({"city": "b"}, 3.0), ({"city": "other"}, 2.0)]


def test_top_n_samples_no_tail():
    samples = top_n_samples({"a": 5, "b": 3}, "service", 5)
    assert samples == [({"service": "a"}, 5.0), ({"service": "b"}, 3.0)]


@pytest.mark.asyncio
async def test_metrics_endpoint_serves_business_metrics(seeded_db):
    from app.main import app

    data = await collect_business_metrics(seeded_db)
    business_collector.update(data)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/metrics")

    assert response.status_code == 200
    assert "business_sessions_active 1.0" in response.text
    assert "business_leads_24h 1.0" in response.text
    assert "business_conversion_rate_24h 0.5" in response.text
    assert 'business_referral_sources_24h{source="organic:yandex"} 1.0' in response.text
    assert "tracking_events_total" in response.text


@pytest.mark.asyncio
async def test_bounce_rate_boundary_page_views(seeded_db):
    s5 = uuid.uuid4()
    seeded_db.add(make_session(s5, "v5", started_at=hours_ago(1), last_activity_at=hours_ago(1),
                               duration=100, page_views=2))
    seeded_db.add(make_event(s5, "v5", "page_view", hours_ago(1)))
    seeded_db.add(make_event(s5, "v5", "page_view", hours_ago(0.9)))
    await seeded_db.commit()

    data = await collect_business_metrics(seeded_db)
    assert data["business_sessions_24h"] == [({}, 3.0)]
    assert data["business_bounce_rate_24h"] == [({}, 1.0 / 3.0)]
