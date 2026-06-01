from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.stats import StatsResponse, StatsPeriod
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.get("/stats")
async def get_stats(
    period: StatsPeriod = Query("24h", description="Period: 24h, 7d, 30d"),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    stats = await service.get_stats(period)
    return {"success": True, "data": StatsResponse(**stats).model_dump()}
