"""
Verdant Backend – Application Configuration (Part A)
Uses pydantic-settings for typed, validated configuration from environment.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from typing import Optional

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
    ALLOWED_ORIGINS: str = '["http://localhost:3000","http://localhost:5173","http://localhost:8080"]'

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse ALLOWED_ORIGINS from JSON array, comma-separated, or plain string."""
        v = self.ALLOWED_ORIGINS.strip() if self.ALLOWED_ORIGINS else ""
        if not v:
            return ["*"]
        # Try JSON array first
        if v.startswith("["):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(i) for i in parsed]
            except (json.JSONDecodeError, ValueError):
                pass
        # Comma-separated or single origin
        return [origin.strip() for origin in v.split(",") if origin.strip()]

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
    USE_REDIS_RATE_LIMIT: bool = True  # Use Redis for distributed rate limiting

    # ── Account Lockout ───────────────────────────────────
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    # ── Security Headers ──────────────────────────────────
    ENABLE_SECURITY_HEADERS: bool = True

    # ── Pricing Engine ────────────────────────────────────
    PRICING_UPDATE_INTERVAL_SECONDS: int = 10
    BASE_ENERGY_PRICE_KWH: float = 0.12  # USD per kWh

    # ── AI Services (Groq + Gemini + Sarvam) ──────────────
    # Set these in your .env / Render dashboard to enable AI endpoints.
    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    SARVAM_API_KEY: Optional[str] = None

    # ── Neo4j (Graph Database) ────────────────────────────
    NEO4J_URI: str = "neo4j://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    NEO4J_DATABASE: str = "neo4j"
    # Set to True only when a real Neo4j instance is configured
    ENABLE_NEO4J: bool = False


@lru_cache()
def get_settings() -> Settings:
    """Singleton settings instance (cached)."""
    return Settings()
