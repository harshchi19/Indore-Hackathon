"""
Verdant Backend – Energy / marketplace schemas (Part A)
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.db.base import EnergySource, ListingStatus


# ── Energy Listing ──────────────────────────────────────────
class EnergyListingCreateRequest(BaseModel):
    producer_id: str
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    energy_source: EnergySource
    quantity_kwh: float = Field(..., gt=0)
    price_per_kwh: float = Field(..., gt=0)
    min_purchase_kwh: float = Field(default=1.0, gt=0)
    available_until: Optional[datetime] = None


class EnergyListingResponse(BaseModel):
    id: str
    producer_id: str
    owner_id: str
    title: str
    description: Optional[str] = None
    energy_source: EnergySource
    quantity_kwh: float
    price_per_kwh: float
    min_purchase_kwh: float
    status: ListingStatus
    available_from: datetime
    available_until: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EnergyListingListResponse(BaseModel):
    total: int
    items: List[EnergyListingResponse]


# ── Buy ─────────────────────────────────────────────────────
class BuyEnergyRequest(BaseModel):
    listing_id: str
    quantity_kwh: float = Field(..., gt=0)


class BuyEnergyResponse(BaseModel):
    detail: str
    listing_id: str
    quantity_kwh: float
    contract_id: str
    payment_id: str
    transaction_ref: str
    total_amount: float


# ── Pricing ─────────────────────────────────────────────────
class SpotPriceResponse(BaseModel):
    energy_source: EnergySource
    price_per_kwh: float
    currency: str = "USD"
    timestamp: datetime


class HistoricalPricePoint(BaseModel):
    timestamp: datetime
    price_per_kwh: float


class HistoricalPriceResponse(BaseModel):
    energy_source: EnergySource
    currency: str = "USD"
    data: List[HistoricalPricePoint]
