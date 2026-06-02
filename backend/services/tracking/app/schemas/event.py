from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

EventType = Literal[
    "page_view", "service_click", "phone_click",
    "messenger_click", "form_submit"
]


class EventCreate(BaseModel):
    session_id: UUID
    visitor_id: str = Field(max_length=100)
    event_type: EventType
    event_name: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    page_url: str | None = None
    referrer: str | None = None


class BatchEventCreate(BaseModel):
    events: list[EventCreate] = Field(max_length=50)


class BatchEventResponse(BaseModel):
    processed: int
    event_ids: list[UUID]


class EventResponse(BaseModel):
    event_id: UUID
    created_at: datetime
