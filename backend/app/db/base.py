"""
Verdant Backend – Shared base document & enums (Part A)
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


# ── Shared Enums ────────────────────────────────────────────
class UserRole(str, Enum):
    CONSUMER = "consumer"
    PRODUCER = "producer"
    ADMIN = "admin"


class EnergySource(str, Enum):
    SOLAR = "solar"
    WIND = "wind"
    HYDRO = "hydro"
    BIOMASS = "biomass"
    GEOTHERMAL = "geothermal"


class ListingStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class ProducerStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"


# ── Timestamped Base Document ───────────────────────────────
class TimestampedDocument(Document):
    """
    Abstract base providing created_at / updated_at fields.
    Subclass this instead of raw ``Document``.
    """

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    async def save(self, *args, **kwargs):  # type: ignore[override]
        self.updated_at = datetime.now(timezone.utc)
        return await super().save(*args, **kwargs)

    class Settings:
        use_state_management = True
