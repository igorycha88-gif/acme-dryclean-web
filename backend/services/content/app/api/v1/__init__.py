from fastapi import APIRouter

from app.api.v1 import content
from app.api.v1.content import auth

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(content.router)
