from dataclasses import asdict

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.postgres_metrics import PgStats, render_postgres_metrics


def make_stats(**overrides) -> PgStats:
    defaults = dict(
        datname="dryclean_content",
        size_bytes=1_048_576,
        numbackends=3,
        xact_commit=1500,
        xact_rollback=20,
        blks_read=4000,
        blks_hit=90_000,
        tup_returned=250_000,
        tup_fetched=5_000,
        tup_inserted=100,
        tup_updated=10,
        tup_deleted=5,
        conflicts=0,
        deadlocks=0,
        temp_files=2,
        temp_bytes=8192,
        max_connections=100,
    )
    defaults.update(overrides)
    return PgStats(**defaults)


def test_render_full_pg_metrics():
    body = render_postgres_metrics(make_stats())

    assert "# HELP pg_up Whether the last query of PostgreSQL succeeded" in body
    assert "# TYPE pg_up gauge" in body
    assert "pg_up 1" in body
    assert 'pg_database_size_bytes{datname="dryclean_content"} 1048576' in body
    assert 'pg_stat_database_numbackends{datname="dryclean_content"} 3' in body
    assert "# TYPE pg_stat_database_xact_commit counter" in body
    assert 'pg_stat_database_xact_commit{datname="dryclean_content"} 1500' in body
    assert 'pg_stat_database_xact_rollback{datname="dryclean_content"} 20' in body
    assert 'pg_stat_database_blks_read{datname="dryclean_content"} 4000' in body
    assert 'pg_stat_database_blks_hit{datname="dryclean_content"} 90000' in body
    assert 'pg_stat_database_deadlocks{datname="dryclean_content"} 0' in body
    assert 'pg_stat_database_temp_bytes{datname="dryclean_content"} 8192' in body
    assert "pg_max_connections 100" in body
    assert "pg_connections 3" in body


def test_render_pg_down():
    body = render_postgres_metrics(None)

    assert "pg_up 0" in body
    assert "pg_database_size_bytes" not in body
    assert "pg_stat_database_xact_commit" not in body


class FailingFactory:
    def __call__(self):
        return self

    async def __aenter__(self):
        raise RuntimeError("db down")

    async def __aexit__(self, *args):
        return False


class FakeResult:
    def __init__(self, row):
        self._row = row

    def one(self):
        class Row:
            _mapping = self._row
        return Row()


class FakeSession:
    def __init__(self, row):
        self._row = row

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def execute(self, _query):
        return FakeResult(self._row)


class FakeSessionFactory:
    def __init__(self, row):
        self._row = row

    def __call__(self):
        return FakeSession(self._row)


@pytest.mark.asyncio
async def test_collect_pg_stats_success():
    from app.core.postgres_metrics import collect_pg_stats

    stats = await collect_pg_stats(FakeSessionFactory(asdict(make_stats())))
    assert stats is not None
    assert stats.datname == "dryclean_content"
    assert stats.xact_commit == 1500


@pytest.mark.asyncio
async def test_collect_pg_stats_failure_returns_none():
    from app.core.postgres_metrics import collect_pg_stats

    assert await collect_pg_stats(FailingFactory()) is None


@pytest.mark.asyncio
async def test_postgres_metrics_endpoint_down_without_db():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/metrics/postgres")

    # unreachable DB still answers 2xx with pg_up 0 (postgres_exporter contract)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert "pg_up 0" in response.text
    assert "pg_up 1" not in response.text


@pytest.mark.asyncio
async def test_postgres_metrics_endpoint_success(monkeypatch):
    import app.core.postgres_metrics as pm
    from app.main import app

    monkeypatch.setattr(
        pm, "AsyncSessionLocal", FakeSessionFactory(asdict(make_stats()))
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/metrics/postgres")

    assert response.status_code == 200
    assert "pg_up 1" in response.text
    assert 'pg_stat_database_xact_commit{datname="dryclean_content"} 1500' in response.text


@pytest.mark.asyncio
async def test_postgres_metrics_not_counted_in_http_metrics():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.get("/metrics/postgres")
        response = await client.get("/metrics")

    assert 'route="/metrics/postgres"' not in response.text
