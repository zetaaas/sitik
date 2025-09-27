import secrets
from functools import lru_cache
from typing import List, Optional

from pydantic import BaseSettings, AnyHttpUrl


class Settings(BaseSettings):
    api_v1_prefix: str = "/api"
    project_name: str = "Civil Oversight Platform"
    secret_key: str = secrets.token_urlsafe(32)
    access_token_expire_minutes: int = 60 * 24

    database_url: str = "postgresql+psycopg2://cop:cop@postgres:5432/cop"
    redis_url: str = "redis://redis:6379/0"
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minio"
    minio_secret_key: str = "minio123"
    minio_bucket: str = "uploads"
    minio_secure: bool = False

    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"

    rate_limit_default: str = "30/minute"

 codex/create-backend-for-civil-oversight-platform
    twofa_code_ttl_seconds: int = 300


CODEXX
    clamav_enabled: bool = False
    thumbnail_sizes: List[int] = [256]

    audit_kms_key: Optional[str] = None
    iin_hmac_key: str = "super-secret-hmac"

    backend_cors_origins: List[AnyHttpUrl] = []

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
