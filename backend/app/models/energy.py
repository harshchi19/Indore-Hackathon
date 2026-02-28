"""
Verdant Backend – Energy listing document model (Part A)
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from pydantic import Field

from app.db.base import EnergySource, ListingStatus, TimestampedDocument


class EnergyListing(TimestampedDocument):
    """MongoDB document for marketplace energy listings."""

    producer_id: PydanticObjectId  # references Producer._id
    owner_id: PydanticObjectId  # references User._id (denormalised for fast queries)
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    energy_source: EnergySource
    quantity_kwh: float = Field(..., gt=0, description="Energy offered in kWh")
    price_per_kwh: float = Field(..., gt=0, description="Asking price in USD/kWh")
    min_purchase_kwh: float = Field(default=1.0, gt=0)
    status: ListingStatus = ListingStatus.ACTIVE
    available_from: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    available_until: Optional[datetime] = None

    class Settings:
        name = "energy_listings"
        use_state_management = True
        indexes = [
            "producer_id",
            "owner_id",
            "status",
            "energy_source",
        ]
