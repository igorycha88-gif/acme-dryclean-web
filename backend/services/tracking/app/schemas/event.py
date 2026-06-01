from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Any, Literal

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


class EventResponse(BaseModel):
    event_id: UUID
    created_at: datetime
