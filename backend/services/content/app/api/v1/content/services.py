from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.content.auth import get_current_admin
from app.database import get_db
from app.models.models import Service, User
from app.schemas.schemas import ReorderRequest, ServiceCreate, ServiceListResponse, ServiceResponse, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=ServiceListResponse)
async def list_services(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Service)

    if search:
        query = query.where(Service.title.ilike(f"%{search}%"))
    if is_active is not None:
        query = query.where(Service.is_active == is_active)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Service.sort_order, Service.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    return ServiceListResponse(
        items=[ServiceResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(
    data: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    service = Service(**data.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return ServiceResponse.model_validate(service)


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return ServiceResponse.model_validate(service)


@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: UUID,
    data: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(service, key, value)

    await db.commit()
    await db.refresh(service)
    return ServiceResponse.model_validate(service)


@router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    await db.delete(service)
    await db.commit()


@router.post("/reorder")
async def reorder_services(
    data: ReorderRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    for idx, service_id in enumerate(data.ids):
        result = await db.execute(select(Service).where(Service.id == service_id))
        service = result.scalar_one_or_none()
        if service:
            service.sort_order = idx

    await db.commit()
    return {"success": True}
