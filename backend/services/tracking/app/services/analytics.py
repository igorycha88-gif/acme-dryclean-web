import uuid
from datetime import UTC, datetime, timedelta

import structlog
from sqlalchemy import func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.geo import geo_resolver
from app.models.analytics import AnalyticsEvent, AnalyticsSession
from app.schemas.event import EventCreate
from app.schemas.stats import StatsPeriod

logger = structlog.get_logger()


def classify_referrer(referrer: str | None) -> str:
    if not referrer:
        return "direct"
    ref_lower = referrer.lower()
    organic_domains = {
        "yandex": "organic:yandex",
        "google": "organic:google",
        "bing": "organic:bing",
        "mail.ru": "organic:mail",
        "sputnik": "organic:sputnik",
    }
    social_domains = {
        "t.me": "social:telegram",
        "telegram": "social:telegram",
        "vk.com": "social:vk",
        "vk.cc": "social:vk",
        "instagram": "social:instagram",
        "facebook": "social:facebook",
        "whatsapp": "social:whatsapp",
        "viber": "social:viber",
    }
    for domain, group in organic_domains.items():
        if domain in ref_lower:
            return group
    for domain, group in social_domains.items():
        if domain in ref_lower:
            return group
    return "other"


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_event(self, event_data: EventCreate, ip_address: str | None = None,
                           user_agent: str | None = None) -> AnalyticsEvent:
        geo = geo_resolver.resolve(ip_address)
        referrer_group = classify_referrer(event_data.referrer)

        event = AnalyticsEvent(
            id=uuid.uuid4(),
            session_id=event_data.session_id,
            visitor_id=event_data.visitor_id,
            event_type=event_data.event_type,
            event_name=event_data.event_name,
            payload=event_data.payload,
            page_url=event_data.page_url,
            referrer=event_data.referrer,
            referrer_group=referrer_group,
            user_agent=user_agent,
            ip_address=ip_address,
            geo_city=geo["city"],
            geo_country=geo["country"],
        )
        self.db.add(event)

        await self._update_session(event_data, referrer_group, ip_address, user_agent, geo)

        await self.db.flush()

        return event

    async def _update_session(self, event_data: EventCreate, referrer_group: str,
                               ip_address: str | None, user_agent: str | None,
                               geo: dict[str, str | None]):
        now = datetime.now(UTC)
        timeout = timedelta(minutes=settings.session_timeout_minutes)

        result = await self.db.execute(
            select(AnalyticsSession).where(
                AnalyticsSession.session_id == event_data.session_id
            )
        )
        session = result.scalar_one_or_none()

        if session:
            last_at = session.last_activity_at
            if last_at and last_at.tzinfo is None:
                last_at = last_at.replace(tzinfo=UTC)
            time_since_last = now - last_at if last_at else timeout
            session.last_activity_at = now
            if event_data.event_type == "page_view" and time_since_last < timeout:
                session.page_views_count = (session.page_views_count or 0) + 1
        else:
            session = AnalyticsSession(
                id=uuid.uuid4(),
                session_id=event_data.session_id,
                visitor_id=event_data.visitor_id,
                first_page_url=event_data.page_url,
                referrer=event_data.referrer,
                referrer_group=referrer_group,
                user_agent=user_agent,
                ip_address=ip_address,
                geo_city=geo["city"],
                geo_country=geo["country"],
                page_views_count=1,
                started_at=now,
                last_activity_at=now,
            )
            self.db.add(session)

        if event_data.event_type == "page_view":
            started = session.started_at
            if started and started.tzinfo is None:
                started = started.replace(tzinfo=UTC)
            session.duration_seconds = int((now - started).total_seconds()) if started else 0

    async def get_stats(self, period: StatsPeriod = "24h") -> dict:
        since = datetime.now(UTC) - (
            timedelta(hours=24) if period == "24h"
            else timedelta(days=7) if period == "7d"
            else timedelta(days=30)
        )

        visitors_query = select(func.count(func.distinct(AnalyticsEvent.session_id))).where(
            AnalyticsEvent.created_at >= since
        )
        visitors_result = await self.db.execute(visitors_query)
        visitors = visitors_result.scalar() or 0

        unique_query = select(func.count(func.distinct(AnalyticsEvent.visitor_id))).where(
            AnalyticsEvent.created_at >= since
        )
        unique_result = await self.db.execute(unique_query)
        unique_visitors = unique_result.scalar() or 0

        page_views_query = select(func.count(AnalyticsEvent.id)).where(
            AnalyticsEvent.event_type == "page_view",
            AnalyticsEvent.created_at >= since
        )
        page_views_result = await self.db.execute(page_views_query)
        page_views = page_views_result.scalar() or 0

        sessions_query = select(AnalyticsSession).where(
            AnalyticsSession.started_at >= since
        )
        sessions_result = await self.db.execute(sessions_query)
        sessions = sessions_result.scalars().all()

        total_sessions = len(sessions)
        bounce_count = sum(1 for s in sessions if s.page_views_count <= 1)
        bounce_rate = round((bounce_count / total_sessions * 100) if total_sessions > 0 else 0, 1)
        avg_duration = round(
            sum(s.duration_seconds for s in sessions) / total_sessions
            if total_sessions > 0 else 0, 1
        )
        avg_pages = round(
            sum(s.page_views_count for s in sessions) / total_sessions
            if total_sessions > 0 else 1.0, 1
        )

        service_clicks = await self._agg_service_clicks(since)
        phone_clicks = await self._agg_phone_clicks(since)
        messenger_clicks = await self._agg_messenger_clicks(since)
        form_submits = await self._agg_form_submits(since)
        sources = await self._agg_sources(since)
        top_cities = await self._agg_top_cities(since)
        hourly = await self._agg_hourly(since)

        return {
            "visitors": visitors,
            "unique_visitors": unique_visitors,
            "page_views": page_views,
            "bounce_rate": bounce_rate,
            "avg_duration_seconds": avg_duration,
            "avg_pages_per_session": avg_pages,
            "service_clicks": service_clicks,
            "phone_clicks": phone_clicks,
            "messenger_clicks": messenger_clicks,
            "form_submits": form_submits,
            "sources": sources,
            "top_cities": top_cities,
            "hourly_distribution": hourly,
        }

    async def _agg_service_clicks(self, since: datetime) -> dict[str, int]:
        slug_col = AnalyticsEvent.payload["service_slug"].as_string().label("slug_val")
        q = select(
            slug_col,
            func.count(AnalyticsEvent.id)
        ).where(
            AnalyticsEvent.event_type == "service_click",
            AnalyticsEvent.created_at >= since
        ).group_by(literal_column("slug_val"))
        result = await self.db.execute(q)
        return {row[0] or "unknown": row[1] for row in result}

    async def _agg_phone_clicks(self, since: datetime) -> dict[str, int]:
        phone_col = AnalyticsEvent.payload["phone"].as_string().label("phone_val")
        q = select(
            phone_col,
            func.count(AnalyticsEvent.id)
        ).where(
            AnalyticsEvent.event_type == "phone_click",
            AnalyticsEvent.created_at >= since
        ).group_by(literal_column("phone_val"))
        result = await self.db.execute(q)
        return {row[0] or "unknown": row[1] for row in result}

    async def _agg_messenger_clicks(self, since: datetime) -> dict[str, int]:
        msg_col = AnalyticsEvent.payload["messenger"].as_string().label("msg_val")
        q = select(
            msg_col,
            func.count(AnalyticsEvent.id)
        ).where(
            AnalyticsEvent.event_type == "messenger_click",
            AnalyticsEvent.created_at >= since
        ).group_by(literal_column("msg_val"))
        result = await self.db.execute(q)
        return {row[0] or "unknown": row[1] for row in result}

    async def _agg_form_submits(self, since: datetime) -> dict:
        total_q = select(func.count(AnalyticsEvent.id)).where(
            AnalyticsEvent.event_type == "form_submit",
            AnalyticsEvent.created_at >= since
        )
        total = (await self.db.execute(total_q)).scalar() or 0

        by_loc_col = AnalyticsEvent.payload["form_location"].as_string().label("loc_val")
        by_loc_q = select(
            by_loc_col,
            func.count(AnalyticsEvent.id)
        ).where(
            AnalyticsEvent.event_type == "form_submit",
            AnalyticsEvent.created_at >= since
        ).group_by(literal_column("loc_val"))
        by_loc = {row[0] or "unknown": row[1] for row in await self.db.execute(by_loc_q)}

        success_q = select(func.count(AnalyticsEvent.id)).where(
            AnalyticsEvent.event_type == "form_submit",
            AnalyticsEvent.payload["success"].as_boolean().is_(True),
            AnalyticsEvent.created_at >= since
        )
        success = (await self.db.execute(success_q)).scalar() or 0

        return {
            "total": total,
            "by_location": by_loc,
            "success_rate": round((success / total * 100) if total > 0 else 0, 1),
        }

    async def _agg_sources(self, since: datetime) -> dict[str, int]:
        q = select(
            AnalyticsSession.referrer_group,
            func.count(AnalyticsSession.id)
        ).where(
            AnalyticsSession.started_at >= since
        ).group_by(AnalyticsSession.referrer_group)
        result = await self.db.execute(q)
        return {row[0] or "direct": row[1] for row in result}

    async def _agg_top_cities(self, since: datetime, limit: int = 10) -> list[dict]:
        q = select(
            AnalyticsSession.geo_city,
            func.count(func.distinct(AnalyticsSession.visitor_id))
        ).where(
            AnalyticsSession.started_at >= since,
            AnalyticsSession.geo_city.isnot(None)
        ).group_by(AnalyticsSession.geo_city).order_by(
            func.count(func.distinct(AnalyticsSession.visitor_id)).desc()
        ).limit(limit)
        result = await self.db.execute(q)
        return [{"city": row[0], "visitors": row[1]} for row in result]

    async def _agg_hourly(self, since: datetime) -> dict[str, int]:
        q = select(
            func.extract("hour", AnalyticsEvent.created_at).label("hour"),
            func.count(AnalyticsEvent.id)
        ).where(
            AnalyticsEvent.event_type == "page_view",
            AnalyticsEvent.created_at >= since
        ).group_by("hour").order_by("hour")
        result = await self.db.execute(q)
        return {str(int(row[0])): row[1] for row in result}
