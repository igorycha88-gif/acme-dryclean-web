from prometheus_client import Counter, Histogram, generate_latest, REGISTRY
from starlette.responses import Response

events_total = Counter(
    "tracking_events_total",
    "Total number of tracking events",
    ["event_type", "status"]
)

events_duration = Histogram(
    "tracking_event_duration_seconds",
    "Duration of event processing",
    ["event_type"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0)
)


async def metrics_endpoint():
    return Response(content=generate_latest(REGISTRY), media_type="text/plain")


def setup_metrics(app):
    @app.get("/metrics", include_in_schema=False)
    async def metrics():
        return await metrics_endpoint()
