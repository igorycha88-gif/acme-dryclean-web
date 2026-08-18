import time

from prometheus_client import REGISTRY, Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

EXCLUDED_PATHS = {"/metrics", "/health"}
STATIC_PREFIXES = ("/uploads", "/static")

http_requests_total = Counter(
    "content_http_requests_total",
    "Total HTTP requests handled by content service",
    ["method", "route", "code"],
)

http_request_duration = Histogram(
    "content_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "route"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5),
)


def get_route_pattern(request: Request) -> str:
    route = request.scope.get("route")
    path = getattr(route, "path", None)
    if path:
        return path
    raw_path = request.url.path
    for prefix in STATIC_PREFIXES:
        if raw_path.startswith(prefix):
            return prefix
    return "/unhandled"


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in EXCLUDED_PATHS:
            return await call_next(request)
        method = request.method
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start
        route = get_route_pattern(request)
        http_requests_total.labels(method, route, str(response.status_code)).inc()
        http_request_duration.labels(method, route).observe(duration)
        return response


def setup_metrics(app) -> None:
    app.add_middleware(MetricsMiddleware)

    @app.get("/metrics", include_in_schema=False)
    async def metrics():
        return Response(content=generate_latest(REGISTRY), media_type="text/plain")
