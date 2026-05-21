from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ServiceBase(BaseModel):
    title: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=200)
    description: str
    image_url: str | None = Field(None, max_length=500)
    price: Decimal | None = Field(None, decimal_places=2)
    category: str | None = Field(None, max_length=100)
    is_active: bool = True
    sort_order: int = 0


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    slug: str | None = Field(None, max_length=200)
    description: str | None = None
    image_url: str | None = Field(None, max_length=500)
    price: Decimal | None = Field(None, decimal_places=2)
    category: str | None = Field(None, max_length=100)
    is_active: bool | None = None
    sort_order: int | None = None


class ServiceResponse(ServiceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceListResponse(BaseModel):
    items: list[ServiceResponse]
    total: int
    page: int
    per_page: int


class FAQBase(BaseModel):
    question: str = Field(..., max_length=500)
    answer: str
    is_active: bool = True
    sort_order: int = 0


class FAQCreate(FAQBase):
    pass


class FAQUpdate(BaseModel):
    question: str | None = Field(None, max_length=500)
    answer: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class FAQResponse(FAQBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FAQListResponse(BaseModel):
    items: list[FAQResponse]
    total: int
    page: int
    per_page: int


class ReviewBase(BaseModel):
    author: str = Field(..., max_length=100)
    service: str = Field(..., max_length=200)
    rating: int = Field(..., ge=1, le=5)
    text: str
    is_active: bool = False


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    author: str | None = Field(None, max_length=100)
    service: str | None = Field(None, max_length=200)
    rating: int | None = Field(None, ge=1, le=5)
    text: str | None = None
    is_active: bool | None = None


class ReviewResponse(ReviewBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]
    total: int
    page: int
    per_page: int


class MediaBase(BaseModel):
    alt_text: str | None = Field(None, max_length=200)


class MediaResponse(MediaBase):
    id: UUID
    filename: str
    original_name: str
    url: str
    mime_type: str
    size: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MediaListResponse(BaseModel):
    items: list[MediaResponse]
    total: int
    page: int
    per_page: int


class ReorderRequest(BaseModel):
    ids: list[UUID]


class UserBase(BaseModel):
    username: str = Field(..., max_length=100)
    email: str = Field(..., max_length=255)
    full_name: str | None = Field(None, max_length=200)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    username: str | None = Field(None, max_length=100)
    email: str | None = Field(None, max_length=255)
    full_name: str | None = Field(None, max_length=200)
    password: str | None = Field(None, min_length=6)
    is_active: bool | None = None
    is_admin: bool | None = None


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    full_name: str | None
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
