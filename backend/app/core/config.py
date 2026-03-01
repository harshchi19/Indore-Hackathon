"""
Verdant Backend – Application Configuration (Part A)
Uses pydantic-settings for typed, validated configuration from environment.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Resolve .env relative to this file – file may not exist in production
# (Render / Docker inject env vars directly).
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"
_ENV_FILE_PATH = str(_ENV_FILE) if _ENV_FILE.is_file() else None


class Settings(BaseSettings):
    """
    Central configuration loaded from environment variables / .env file.
    """

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE_PATH or "",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────
    APP_NAME: str = "Verdant Energy Platform"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")
    LOG_LEVEL: str = "INFO"

    # ── Server (Render injects PORT) ──────────────────────
    PORT: int = 8000

    # ── API ───────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]

    # ── MongoDB ───────────────────────────────────────────
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "verdant"

    # ── Redis ─────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT ───────────────────────────────────────────────
    JWT_SECRET_KEY: str = "CHANGE-ME-super-secret-jwt-key-for-dev"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Rate Limiting ─────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60

    # ── Pricing Engine ────────────────────────────────────
    PRICING_UPDATE_INTERVAL_SECONDS: int = 10
    BASE_ENERGY_PRICE_KWH: float = 0.12  # USD per kWh


@lru_cache()
def get_settings() -> Settings:
    """Singleton settings instance (cached)."""
    return Settings()
