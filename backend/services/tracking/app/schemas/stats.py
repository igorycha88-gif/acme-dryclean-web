from typing import Any, Literal

from pydantic import BaseModel

StatsPeriod = Literal["24h", "7d", "30d"]


class StatsResponse(BaseModel):
    visitors: int
    unique_visitors: int
    page_views: int
    bounce_rate: float
    avg_duration_seconds: float
    avg_pages_per_session: float
    service_clicks: dict[str, int]
    phone_clicks: dict[str, int]
    messenger_clicks: dict[str, int]
    form_submits: dict[str, Any]
    sources: dict[str, int]
    top_cities: list[dict[str, Any]]
    hourly_distribution: dict[str, int]
