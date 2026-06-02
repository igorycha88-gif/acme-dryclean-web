from fastapi import APIRouter

from app.api.v1.endpoints import stats, track

router = APIRouter(prefix="/api/v1")
router.include_router(track.router)
router.include_router(stats.router)
