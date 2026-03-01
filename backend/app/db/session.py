"""
Verdant Backend – Database session / connection manager (Part A)
Motor + Beanie async MongoDB init.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("db.session")

settings = get_settings()

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> AsyncIOMotorDatabase:
    """
    Initialise the Motor client + Beanie ODM.
    Call once at application startup.
    """
    global _client, _db

    from beanie import init_beanie

    # Import all document models so Beanie can discover them
    # Part A models
    from app.models.users import User
    from app.models.producers import Producer
    from app.models.energy import EnergyListing
    # Part B models
    from app.models.contracts import Contract
    from app.models.certificates import Certificate
    from app.models.payments import Payment
    from app.models.disputes import Dispute
    from app.models.smart_meter import SmartMeterReading

    _client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=10_000,  # fail fast (10s) instead of 30s default
        connectTimeoutMS=10_000,
        socketTimeoutMS=10_000,
    )
    _db = _client[settings.MONGODB_DB_NAME]

    await init_beanie(
        database=_db,
        document_models=[
            User, Producer, EnergyListing,
            Contract, Certificate, Payment, Dispute, SmartMeterReading,
        ],
    )

    logger.info("MongoDB connected – database: %s", settings.MONGODB_DB_NAME)
    return _db


async def close_db() -> None:
    """Gracefully close the Motor client."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    """Return the active database handle (must be connected first)."""
    if _db is None:
        raise RuntimeError("Database not initialised – call connect_db() first")
    return _db
