import asyncio
import threading
from datetime import UTC, datetime, timedelta

import structlog
from prometheus_client.core import Metric
from prometheus_client.registry import REGISTRY, Collector
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session_factory
from app.models.analytics import AnalyticsEvent, AnalyticsSession

logger = structlog.get_logger()

LEAD_EVENT_TYPES = ("form_submit", "phone_click", "messenger_click")
STARTUP_DELAY_SECONDS = 5
UPDATE_TIMEOUT_SECONDS = 5.0
GEO_TOP = 10
SERVICES_TOP = 20

_METRIC_INFO = {
    "business_sessions_active": "Sessions with activity in the last 30 minutes",
    "business_page_views_24h": "Page view events in the last 24 hours",
    "business_page_views_1h": "Page view events in the last hour",
    "business_unique_visitors_24h": "Unique visitors in the last 24 hours",
    "business_sessions_24h": "Sessions started in the last 24 hours",
    "business_avg_session_duration_seconds_24h": "Average session duration in seconds over 24h",
    "business_bounce_rate_24h": "Share of 24h sessions with a single page view (0..1)",
    "business_events_24h": "Events in the last 24 hours by type",
    "business_leads_24h": "Lead events (form/phone/messenger) in the last 24 hours",
    "business_leads_1h": "Lead events in the last hour",
    "business_conversion_rate_24h": "leads_24h divided by unique_visitors_24h",
    "business_referral_sources_24h": "24h sessions grouped by referrer source",
    "business_geo_visitors_24h": "Unique visitors per city over 24h",
    "business_service_clicks_24h": "Service click events per service over 24h",
}


def top_n_samples(counts: dict[str, int], label: str, limit: int) -> list[tuple[dict[str, str], float]]:
    ordered = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    samples = [({label: name}, float(value)) for name, value in ordered[:limit]]
    tail = ordered[limit:]
    if tail:
        samples.append(({label: "other"}, float(sum(value for _, value in tail))))
    return samples


class BusinessMetricsCollector(Collector):
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._data: dict[str, list[tuple[dict[str, str], float]]] = {}

    def update(self, data: dict[str, list[tuple[dict[str, str], float]]]) -> None:
        with self._lock:
            self._data = data

    def snapshot(self) -> dict[str, list[tuple[dict[str, str], float]]]:
        with self._lock:
            return {name: list(samples) for name, samples in self._data.items()}

    def collect(self):
        for name, samples in self.snapshot().items():
            metric = Metric(name, _METRIC_INFO.get(name, "Business metric"), "gauge")
            for labels, value in samples:
                metric.add_sample(name, labels=labels, value=float(value))
            yield metric


business_collector = BusinessMetricsCollector()
REGISTRY.register(business_collector)


async def _scalar(db: AsyncSession, stmt) -> float:
    value = (await db.execute(stmt)).scalar()
    return float(value or 0)


async def collect_business_metrics(db: AsyncSession) -> dict[str, list[tuple[dict[str, str], float]]]:
    now = datetime.now(UTC)
    since_24h = now - timedelta(hours=24)
    since_1h = now - timedelta(hours=1)
    since_30m = now - timedelta(minutes=30)

    data: dict[str, list[tuple[dict[str, str], float]]] = {}

    data["business_sessions_active"] = [({}, await _scalar(
        db,
        select(func.count()).select_from(AnalyticsSession).where(
            AnalyticsSession.last_activity_at > since_30m
        ),
    ))]

    data["business_page_views_24h"] = [({}, await _scalar(
        db,
        select(func.count()).select_from(AnalyticsEvent).where(
            AnalyticsEvent.event_type == "page_view",
            AnalyticsEvent.created_at >= since_24h,
        ),
    ))]

    data["business_page_views_1h"] = [({}, await _scalar(
        db,
        select(func.count()).select_from(AnalyticsEvent).where(
            AnalyticsEvent.event_type == "page_view",
            AnalyticsEvent.created_at >= since_1h,
        ),
    ))]

    unique_visitors = await _scalar(
        db,
        select(func.count(func.distinct(AnalyticsEvent.visitor_id))).where(
            AnalyticsEvent.created_at >= since_24h
        ),
    )
    data["business_unique_visitors_24h"] = [({}, unique_visitors)]

    sessions_row = (await db.execute(
        select(
            func.count(),
            func.coalesce(func.avg(AnalyticsSession.duration_seconds), 0.0),
            func.coalesce(func.avg(case((AnalyticsSession.page_views_count <= 1, 1.0), else_=0.0)), 0.0),
        ).where(AnalyticsSession.started_at >= since_24h)
    )).one()
    data["business_sessions_24h"] = [({}, float(sessions_row[0] or 0))]
    data["business_avg_session_duration_seconds_24h"] = [({}, float(sessions_row[1]))]
    data["business_bounce_rate_24h"] = [({}, float(sessions_row[2]))]

    event_rows = (await db.execute(
        select(AnalyticsEvent.event_type, func.count()).where(
            AnalyticsEvent.created_at >= since_24h
        ).group_by(AnalyticsEvent.event_type)
    )).all()
    data["business_events_24h"] = [
        ({"event_type": event_type or "unknown"}, float(count))
        for event_type, count in event_rows
    ]

    leads_24h = await _scalar(
        db,
        select(func.count()).select_from(AnalyticsEvent).where(
            AnalyticsEvent.event_type.in_(LEAD_EVENT_TYPES),
            AnalyticsEvent.created_at >= since_24h,
        ),
    )
    leads_1h = await _scalar(
        db,
        select(func.count()).select_from(AnalyticsEvent).where(
            AnalyticsEvent.event_type.in_(LEAD_EVENT_TYPES),
            AnalyticsEvent.created_at >= since_1h,
        ),
    )
    data["business_leads_24h"] = [({}, leads_24h)]
    data["business_leads_1h"] = [({}, leads_1h)]
    data["business_conversion_rate_24h"] = [
        ({}, leads_24h / unique_visitors if unique_visitors else 0.0)
    ]

    source_rows = (await db.execute(
        select(AnalyticsSession.referrer_group, func.count()).where(
            AnalyticsSession.started_at >= since_24h
        ).group_by(AnalyticsSession.referrer_group)
    )).all()
    data["business_referral_sources_24h"] = [
        ({"source": group or "direct"}, float(count))
        for group, count in source_rows
    ]

    geo_rows = (await db.execute(
        select(
            AnalyticsEvent.geo_city,
            func.count(func.distinct(AnalyticsEvent.visitor_id)),
        ).where(
            AnalyticsEvent.created_at >= since_24h
        ).group_by(AnalyticsEvent.geo_city)
    )).all()
    geo_counts = {("unknown" if city is None else city): int(count) for city, count in geo_rows}
    data["business_geo_visitors_24h"] = top_n_samples(geo_counts, "city", GEO_TOP)

    service_col = func.coalesce(
        AnalyticsEvent.payload["service_slug"].as_string(),
        AnalyticsEvent.payload["service"].as_string(),
        AnalyticsEvent.event_name,
    )
    service_rows = (await db.execute(
        select(service_col, func.count()).where(
            AnalyticsEvent.event_type == "service_click",
            AnalyticsEvent.created_at >= since_24h,
        ).group_by(service_col)
    )).all()
    service_counts = {(name or "unknown"): int(count) for name, count in service_rows}
    data["business_service_clicks_24h"] = top_n_samples(service_counts, "service", SERVICES_TOP)

    return data


async def update_business_metrics() -> None:
    async with async_session_factory() as db:
        data = await collect_business_metrics(db)
    business_collector.update(data)


async def _update_once() -> None:
    try:
        await asyncio.wait_for(update_business_metrics(), timeout=UPDATE_TIMEOUT_SECONDS)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.error("business_metrics_update_failed", error=str(exc))


async def business_metrics_loop() -> None:
    interval = max(1, settings.business_metrics_interval_seconds)
    logger.info("business_metrics_loop_started", interval_seconds=interval)
    await asyncio.sleep(STARTUP_DELAY_SECONDS)
    while True:
        await _update_once()
        await asyncio.sleep(interval)
