from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from decimal import Decimal


class ServiceBase(BaseModel):
    title: str = Field(..., max_length=200)
    slug: str = Field(..., max_length=200)
    description: str
    image_url: Optional[str] = Field(None, max_length=500)
    price: Optional[Decimal] = Field(None, decimal_places=2)
    category: Optional[str] = Field(None, max_length=100)
    is_active: bool = True
    sort_order: int = 0


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    slug: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    image_url: Optional[str] = Field(None, max_length=500)
    price: Optional[Decimal] = Field(None, decimal_places=2)
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


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
    question: Optional[str] = Field(None, max_length=500)
    answer: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


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
    author: Optional[str] = Field(None, max_length=100)
    service: Optional[str] = Field(None, max_length=200)
    rating: Optional[int] = Field(None, ge=1, le=5)
    text: Optional[str] = None
    is_active: Optional[bool] = None


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
    alt_text: Optional[str] = Field(None, max_length=200)


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
    full_name: Optional[str] = Field(None, max_length=200)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    full_name: Optional[str] = Field(None, max_length=200)
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    full_name: Optional[str]
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