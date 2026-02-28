"""
Verdant Backend – Pricing service (Part A)
Dynamic spot-price calculation & historical data generation.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.base import EnergySource
from app.schemas.energy import (
    HistoricalPricePoint,
    HistoricalPriceResponse,
    SpotPriceResponse,
)

logger = get_logger("services.pricing")
settings = get_settings()

# ── Source-specific multipliers (mock) ──────────────────────
_SOURCE_MULTIPLIER: Dict[EnergySource, float] = {
    EnergySource.SOLAR: 1.0,
    EnergySource.WIND: 0.95,
    EnergySource.HYDRO: 0.80,
    EnergySource.BIOMASS: 1.10,
    EnergySource.GEOTHERMAL: 0.90,
}


def _compute_spot(source: EnergySource) -> float:
    """
    Mock dynamic pricing formula:

        price = base × source_multiplier × time_of_day_factor × (1 + noise)

    Time-of-day factor simulates peak / off-peak pricing.
    """
    now = datetime.now(timezone.utc)
    hour = now.hour

    # Peak hours (8-20 UTC) → multiplier up to 1.4
    time_factor = 1.0 + 0.4 * math.sin(math.pi * (hour - 4) / 16) if 4 <= hour <= 20 else 0.85

    noise = random.uniform(-0.05, 0.05)

    price = (
        settings.BASE_ENERGY_PRICE_KWH
        * _SOURCE_MULTIPLIER.get(source, 1.0)
        * time_factor
        * (1 + noise)
    )
    return round(max(price, 0.01), 6)


def get_spot_price(source: EnergySource) -> SpotPriceResponse:
    """Return the current spot price for *source*."""
    price = _compute_spot(source)
    return SpotPriceResponse(
        energy_source=source,
        price_per_kwh=price,
        timestamp=datetime.now(timezone.utc),
    )


def get_all_spot_prices() -> List[SpotPriceResponse]:
    """Return spot prices for every energy source."""
    return [get_spot_price(s) for s in EnergySource]


def get_historical_prices(
    source: EnergySource,
    hours: int = 24,
    interval_minutes: int = 15,
) -> HistoricalPriceResponse:
    """
    Generate synthetic historical price data going back *hours* from now,
    sampled every *interval_minutes*.
    """
    now = datetime.now(timezone.utc)
    points: List[HistoricalPricePoint] = []
    steps = (hours * 60) // interval_minutes

    for i in range(steps, -1, -1):
        ts = now - timedelta(minutes=i * interval_minutes)
        # Deterministic-ish price using the same formula shifted by timestamp
        hour = ts.hour
        time_factor = 1.0 + 0.4 * math.sin(math.pi * (hour - 4) / 16) if 4 <= hour <= 20 else 0.85
        noise = random.uniform(-0.03, 0.03)
        price = round(
            settings.BASE_ENERGY_PRICE_KWH
            * _SOURCE_MULTIPLIER.get(source, 1.0)
            * time_factor
            * (1 + noise),
            6,
        )
        points.append(HistoricalPricePoint(timestamp=ts, price_per_kwh=max(price, 0.01)))

    return HistoricalPriceResponse(
        energy_source=source,
        data=points,
    )
