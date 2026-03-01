"""
Verdant Backend – Pricing routes (Part A)
Spot price and historical data.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Query

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.base import EnergySource
from app.schemas.energy import HistoricalPriceResponse, SpotPriceResponse
from app.services import pricing_service

logger = get_logger("routes.pricing")
settings = get_settings()

router = APIRouter(prefix="/pricing", tags=["Pricing"])


@router.get(
    "/spot",
    response_model=SpotPriceResponse,
    summary="Get current spot price for an energy source",
)
async def spot_price(
    source: EnergySource = Query(..., description="Energy source type"),
) -> SpotPriceResponse:
    return pricing_service.get_spot_price(source)


@router.get(
    "/spot/all",
    response_model=List[SpotPriceResponse],
    summary="Get spot prices for all energy sources",
)
async def all_spot_prices() -> List[SpotPriceResponse]:
    return pricing_service.get_all_spot_prices()


@router.get(
    "/historical",
    response_model=HistoricalPriceResponse,
    summary="Get historical price data",
)
async def historical_prices(
    source: EnergySource = Query(...),
    hours: int = Query(default=24, ge=1, le=168),
    interval_minutes: int = Query(default=15, ge=1, le=60),
) -> HistoricalPriceResponse:
    return pricing_service.get_historical_prices(source, hours, interval_minutes)
