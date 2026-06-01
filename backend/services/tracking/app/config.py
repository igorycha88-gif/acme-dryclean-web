from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    app_name: str = "Tracking Service"
    app_version: str = "0.1.0"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/dryclean_content"
    database_url_sync: str = "postgresql+psycopg2://dryclean:dryclean_dev@postgres:5432/dryclean_content"

    cors_origins: list[str] = ["*"]

    rate_limit: int = 100
    rate_limit_window: int = 1

    session_timeout_minutes: int = 30

    geoip_db_path: str = "/app/GeoLite2-City.mmdb"

    sentry_dsn: str | None = None

    model_config = {"env_prefix": "TRACKING_", "env_file": ".env", "extra": "ignore"}


settings = Settings()
