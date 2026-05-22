
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_name: str = "content-service"
    host: str = "0.0.0.0"
    port: int = 8011

    database_url: str = "postgresql+asyncpg://dryclean:dryclean_dev@postgres:5432/dryclean_content"
    database_url_sync: str = "postgresql+psycopg2://dryclean:dryclean_dev@postgres:5432/dryclean_content"

    jwt_secret: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24

    upload_dir: str = "/app/uploads"
    max_upload_size: int = 10 * 1024 * 1024
    allowed_extensions: list[str] = ["jpg", "jpeg", "png", "gif", "webp"]

    class Config:
        env_file = ".env"


settings = Settings()
