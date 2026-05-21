from fastapi import APIRouter

from app.api.v1.content import faq, media, reviews, services

router = APIRouter(prefix="/content")

router.include_router(services.router)
router.include_router(faq.router)
router.include_router(reviews.router)
router.include_router(media.router)
