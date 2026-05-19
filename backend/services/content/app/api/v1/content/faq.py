from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models.models import FAQ, User
from app.schemas.schemas import (
    FAQCreate, FAQUpdate, FAQResponse, FAQListResponse, ReorderRequest
)
from app.api.v1.content.auth import get_current_admin

router = APIRouter(prefix="/faq", tags=["faq"])


@router.get("", response_model=FAQListResponse)
async def list_faq(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(FAQ)
    
    if search:
        query = query.where(FAQ.question.ilike(f"%{search}%"))
    if is_active is not None:
        query = query.where(FAQ.is_active == is_active)
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(FAQ.sort_order, FAQ.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return FAQListResponse(
        items=[FAQResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=FAQResponse, status_code=201)
async def create_faq(
    data: FAQCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    faq = FAQ(**data.model_dump())
    db.add(faq)
    await db.commit()
    await db.refresh(faq)
    return FAQResponse.model_validate(faq)


@router.get("/{faq_id}", response_model=FAQResponse)
async def get_faq(
    faq_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return FAQResponse.model_validate(faq)


@router.patch("/{faq_id}", response_model=FAQResponse)
async def update_faq(
    faq_id: UUID,
    data: FAQUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(faq, key, value)
    
    await db.commit()
    await db.refresh(faq)
    return FAQResponse.model_validate(faq)


@router.delete("/{faq_id}", status_code=204)
async def delete_faq(
    faq_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    await db.delete(faq)
    await db.commit()


@router.post("/reorder")
async def reorder_faq(
    data: ReorderRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    for idx, faq_id in enumerate(data.ids):
        result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
        faq = result.scalar_one_or_none()
        if faq:
            faq.sort_order = idx
    
    await db.commit()
    return {"success": True}