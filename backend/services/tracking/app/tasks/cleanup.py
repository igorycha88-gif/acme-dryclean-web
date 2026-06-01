import structlog
from datetime import datetime, timedelta, timezone
from sqlalchemy import delete
from app.database import async_session_factory
from app.models.analytics import AnalyticsEvent, AnalyticsSession

logger = structlog.get_logger()

RETENTION_DAYS = 90


async def cleanup_old_events():
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    async with async_session_factory() as db:
        try:
            del_events = await db.execute(
                delete(AnalyticsEvent).where(AnalyticsEvent.created_at < cutoff)
            )
            del_sessions = await db.execute(
                delete(AnalyticsSession).where(AnalyticsSession.started_at < cutoff)
            )
            await db.commit()
            logger.info("cleanup_completed",
                        events_deleted=del_events.rowcount,
                        sessions_deleted=del_sessions.rowcount)
        except Exception as e:
            await db.rollback()
            logger.error("cleanup_failed", error=str(e))
