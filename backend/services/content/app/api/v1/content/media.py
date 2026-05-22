import uuid
from pathlib import Path
from uuid import UUID

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.content.auth import get_current_admin
from app.config import settings
from app.database import get_db
from app.models.models import Media, User
from app.schemas.schemas import MediaListResponse, MediaResponse

router = APIRouter(prefix="/media", tags=["media"])

UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_file(file: UploadFile) -> tuple[str, str, int]:
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {settings.allowed_extensions}"
        )

    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = UPLOAD_DIR / unique_name

    content = await file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(status_code=400, detail="File too large")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return unique_name, file.filename, len(content)


@router.get("", response_model=MediaListResponse)
async def list_media(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Media).order_by(Media.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    return MediaListResponse(
        items=[MediaResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("/upload", response_model=MediaResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    alt_text: str = Form(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        unique_name, original_name, size = await save_file(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    url = f"/uploads/{unique_name}"

    media = Media(
        filename=unique_name,
        original_name=original_name,
        url=url,
        mime_type=file.content_type or "application/octet-stream",
        size=size,
        alt_text=alt_text,
    )

    db.add(media)
    await db.commit()
    await db.refresh(media)

    return MediaResponse.model_validate(media)


@router.get("/{media_id}", response_model=MediaResponse)
async def get_media(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Media).where(Media.id == media_id))
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return MediaResponse.model_validate(media)


@router.delete("/{media_id}", status_code=204)
async def delete_media(
    media_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Media).where(Media.id == media_id))
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    file_path = UPLOAD_DIR / media.filename
    if file_path.exists():
        file_path.unlink()

    await db.delete(media)
    await db.commit()


@router.get("/file/{filename}")
async def get_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
