import pytest
from httpx import ASGITransport, AsyncClient

from app.core.metrics import get_route_pattern


@pytest.mark.asyncio
async def test_http_metrics_recorded_for_requests():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.get("/health")
        await client.get("/")
        await client.get("/nonexistent-page")
        await client.get("/uploads/photo.jpg")
        response = await client.get("/metrics")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")

    body = response.text
    assert "# HELP content_http_requests_total" in body
    assert "# TYPE content_http_request_duration_seconds histogram" in body
    assert 'route="/"' in body
    assert 'route="/unhandled"' in body
    assert 'route="/uploads"' in body
    assert 'route="/health"' not in body
    assert 'route="/metrics"' not in body
    assert 'code="404"' in body
    assert 'code="200"' in body


@pytest.mark.asyncio
async def test_metrics_endpoint_repeated_scrapes():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        first = await client.get("/metrics")
        second = await client.get("/metrics")

    assert first.status_code == second.status_code == 200


@pytest.mark.asyncio
async def test_non_get_requests_counted():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/nonexistent", json={})
        response = await client.get("/metrics")

    assert 'method="POST"' in response.text


class FakeUrl:
    def __init__(self, path):
        self.path = path


class FakeRequest:
    def __init__(self, path, route=None):
        self.url = FakeUrl(path)
        self.scope = {"route": route} if route else {}


def test_get_route_pattern_uses_route_template():
    class Route:
        path = "/api/v1/content/services/{slug}"

    request = FakeRequest("/api/v1/content/services/himchistka", route=Route())
    assert get_route_pattern(request) == "/api/v1/content/services/{slug}"


def test_get_route_pattern_static_prefixes():
    assert get_route_pattern(FakeRequest("/uploads/img.png")) == "/uploads"
    assert get_route_pattern(FakeRequest("/static/app.js")) == "/static"


def test_get_route_pattern_unhandled():
    assert get_route_pattern(FakeRequest("/whatever")) == "/unhandled"


def _parse_counter(body: str, labels: str) -> float:
    prefix = "content_http_requests_total{" + labels + "} "
    for line in body.splitlines():
        if line.startswith(prefix):
            return float(line[len(prefix):])
    raise AssertionError(f"sample {labels} not found")


@pytest.mark.asyncio
async def test_counter_values_precise():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.get("/metrics")
        before = await client.get("/metrics")
        await client.get("/never-existed")
        await client.get("/never-existed")
        after = await client.get("/metrics")

    unhandled_before = _parse_counter(before.text, 'code="404",method="GET",route="/unhandled"')
    unhandled_after = _parse_counter(after.text, 'code="404",method="GET",route="/unhandled"')
    assert unhandled_after - unhandled_before == 2.0

    metrics_scrapes = [
        line for line in after.text.splitlines()
        if line.startswith('content_http_requests_total{code="200",method="GET",route="/metrics"')
    ]
    assert metrics_scrapes == []
