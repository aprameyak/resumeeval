"""Application configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql://resumescore:password@localhost:5432/resumescore"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    SECRET_KEY: str = "change-me-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage
    STORAGE_BACKEND: str = "local"  # "local" | "s3"
    LOCAL_UPLOAD_PATH: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = None
    S3_ENDPOINT_URL: Optional[str] = None

    # AI / Hiring Agent
    GEMINI_API_KEY: Optional[str] = None
    DEFAULT_MODEL: str = "gemini-2.0-flash"
    LLM_PROVIDER: str = "gemini"

    # GitHub
    GITHUB_TOKEN: Optional[str] = None

    # Hiring Agent Engine path
    HIRING_AGENT_PATH: str = "./hiring-agent"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@resumescore.app"

    @property
    def celery_broker_url(self) -> str:
        return self.REDIS_URL

    @property
    def celery_result_backend(self) -> str:
        return self.REDIS_URL

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()
