import structlog
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.metrics import events_duration, events_total
from app.database import get_db
from app.schemas.event import EventCreate, EventResponse
from app.services.analytics import AnalyticsService

logger = structlog.get_logger()
router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.post("/event")
async def track_event(
    event: EventCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    with events_duration.labels(event_type=event.event_type).time():
        service = AnalyticsService(db)
        ip = request.client.host if request.client else None
        ua = request.headers.get("user-agent")

        try:
            record = await service.record_event(event, ip_address=ip, user_agent=ua)
            events_total.labels(event_type=event.event_type, status="success").inc()
            return {
                "success": True,
                "data": EventResponse(event_id=record.id, created_at=record.created_at).model_dump(mode="json"),
            }
        except Exception as e:
            events_total.labels(event_type=event.event_type, status="error").inc()
            logger.error("event_processing_failed", event_type=event.event_type, error=str(e))
            raise
