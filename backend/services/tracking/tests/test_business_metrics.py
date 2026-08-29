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

    assert data["business_sessions_active"] == [({}, 1.0, None)]
    assert data["business_page_views_24h"] == [({}, 4.0, None)]
    assert data["business_page_views_1h"] == [({}, 1.0, None)]
    assert data["business_unique_visitors_24h"] == [({}, 2.0, None)]
    assert data["business_sessions_24h"] == [({}, 2.0, None)]
    assert data["business_avg_session_duration_seconds_24h"] == [({}, 300.0, None)]
    assert data["business_bounce_rate_24h"] == [({}, 0.5, None)]
    assert data["business_leads_24h"] == [({}, 1.0, None)]
    assert data["business_leads_1h"] == [({}, 0.0, None)]
    assert data["business_conversion_rate_24h"] == [({}, 0.5, None)]

    events_by_type = {labels["event_type"]: value for labels, value, _ in data["business_events_24h"]}
    assert events_by_type == {"page_view": 4.0, "service_click": 1.0, "form_submit": 1.0}

    sources = {labels["source"]: value for labels, value, _ in data["business_referral_sources_24h"]}
    assert sources == {"organic:yandex": 1.0, "direct": 1.0}

    geo = {labels["city"]: value for labels, value, _ in data["business_geo_visitors_24h"]}
    assert geo == {"Москва": 1.0, "unknown": 1.0}

    services = {labels["service"]: value for labels, value, _ in data["business_service_clicks_24h"]}
    assert services == {"suhaya-chistka": 1.0}


@pytest.mark.asyncio
async def test_business_metrics_empty_db(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    data = await collect_business_metrics(db_session)

    assert data["business_sessions_active"] == [({}, 0.0, None)]
    assert data["business_sessions_24h"] == [({}, 0.0, None)]
    assert data["business_avg_session_duration_seconds_24h"] == [({}, 0.0, None)]
    assert data["business_bounce_rate_24h"] == [({}, 0.0, None)]
    assert data["business_conversion_rate_24h"] == [({}, 0.0, None)]
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
    services = {labels["service"]: value for labels, value, _ in data["business_service_clicks_24h"]}
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
    geo = {labels["city"]: value for labels, value, _ in data["business_geo_visitors_24h"]}
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

    business_collector.update({"business_sessions_active": [({}, 7.0, None)]})

    class FailingFactory:
        def __call__(self):
            return self

        async def __aenter__(self):
            raise RuntimeError("db down")

        async def __aexit__(self, *args):
            return False

    monkeypatch.setattr(bm, "async_session_factory", FailingFactory())
    await bm._update_once()

    assert business_collector.snapshot() == {"business_sessions_active": [({}, 7.0, None)]}


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
    assert data["business_leads_24h"] == [({}, 3.0, None)]
    assert data["business_leads_1h"] == [({}, 0.0, None)]


@pytest.mark.asyncio
async def test_phone_click_metrics_event_and_12h(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    s = uuid.uuid4()
    db_session.add_all([
        make_event(s, "v1", "click_phone", hours_ago(13)),
        make_event(s, "v1", "click_phone", hours_ago(2)),
        make_event(s, "v1", "phone_click", hours_ago(1)),   # legacy type counts too
        make_event(s, "v1", "click_phone", hours_ago(30)),  # outside 24h window
    ])
    await db_session.commit()

    data = await collect_business_metrics(db_session)

    # event: one sample per click inside 24h, value 1, ascending timestamps
    # (float seconds — prometheus_client renders them as unix-ms in text format)
    event_samples = data["business_phone_clicks_event"]
    assert len(event_samples) == 3
    assert all(labels == {} and value == 1.0 for labels, value, _ in event_samples)
    ts = [sample[2] for sample in event_samples]
    assert ts == sorted(ts)
    assert ts == [
        (FROZEN_NOW - timedelta(hours=13)).timestamp(),
        (FROZEN_NOW - timedelta(hours=2)).timestamp(),
        (FROZEN_NOW - timedelta(hours=1)).timestamp(),
    ]

    # 12h gauge counts only clicks inside the 12h window
    assert data["business_phone_clicks_12h"] == [({}, 2.0, None)]


@pytest.mark.asyncio
async def test_phone_click_metrics_not_rendered_without_clicks(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    s = uuid.uuid4()
    db_session.add_all([
        make_event(s, "v1", "page_view", hours_ago(1)),
        make_event(s, "v1", "form_submit", hours_ago(1)),
    ])
    await db_session.commit()

    data = await collect_business_metrics(db_session)
    assert "business_phone_clicks_event" not in data
    assert "business_phone_clicks_12h" not in data

    # collector renders nothing for empty sample lists
    business_collector.update(data)
    output = generate_latest().decode()
    assert "business_phone_clicks_event" not in output
    assert "business_phone_clicks_12h" not in output


@pytest.mark.asyncio
async def test_phone_click_metrics_only_old_clicks_skip_12h_gauge(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    s = uuid.uuid4()
    db_session.add(make_event(s, "v1", "click_phone", hours_ago(13)))
    await db_session.commit()

    data = await collect_business_metrics(db_session)
    assert len(data["business_phone_clicks_event"]) == 1
    assert "business_phone_clicks_12h" not in data


@pytest.mark.asyncio
async def test_collector_renders_timestamped_phone_click_samples(db_session, monkeypatch):
    monkeypatch.setattr("app.tasks.business_metrics.datetime", FrozenDatetime)
    s = uuid.uuid4()
    click_at = hours_ago(1)
    db_session.add(make_event(s, "v1", "click_phone", click_at))
    await db_session.commit()

    data = await collect_business_metrics(db_session)
    business_collector.update(data)

    output = generate_latest().decode()
    assert "# HELP business_phone_clicks_12h Phone number (tel:) clicks in the last 12 hours" in output
    assert "# TYPE business_phone_clicks_12h gauge" in output
    assert "business_phone_clicks_12h 1.0" in output
    assert "# HELP business_phone_clicks_event" in output
    assert "# TYPE business_phone_clicks_event gauge" in output
    # ADR-012 / ЧТЗ §2.1: third token is the unix-ms moment of the click.
    # Match the whole line (a naive substring would false-pass on a µs-scale
    # value whose ms prefix coincides).
    expected_ts_ms = int(click_at.timestamp() * 1000)
    expected_line = f"business_phone_clicks_event 1.0 {expected_ts_ms}"
    assert any(line == expected_line for line in output.splitlines()), (
        f"expected exact line {expected_line!r}; got:\n"
        + "\n".join(ln for ln in output.splitlines() if ln.startswith("business_phone_clicks_event"))
    )


def test_top_n_samples_merges_tail():
    samples = top_n_samples({"a": 5, "b": 3, "c": 2}, "city", 2)
    assert samples == [({"city": "a"}, 5.0, None), ({"city": "b"}, 3.0, None), ({"city": "other"}, 2.0, None)]


def test_top_n_samples_no_tail():
    samples = top_n_samples({"a": 5, "b": 3}, "service", 5)
    assert samples == [({"service": "a"}, 5.0, None), ({"service": "b"}, 3.0, None)]


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
    assert data["business_sessions_24h"] == [({}, 3.0, None)]
    assert data["business_bounce_rate_24h"] == [({}, 1.0 / 3.0, None)]
