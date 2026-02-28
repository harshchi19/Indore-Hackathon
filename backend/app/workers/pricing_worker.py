"""
Verdant Backend – Pricing worker (Part A)
Background task that periodically publishes spot-price updates.
In production this would push to Redis Pub/Sub or a message queue (Celery / RQ).
For now it logs and can be consumed by the WebSocket stream.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.base import EnergySource
from app.services.pricing_service import get_spot_price

logger = get_logger("workers.pricing")
settings = get_settings()

# In-memory latest prices (consumed by WebSocket or polling)
latest_prices: dict = {}


async def pricing_loop() -> None:
    """
    Infinite loop that recalculates spot prices and stores them.
    Start this as an ``asyncio.Task`` at application startup.
    """
    logger.info(
        "Pricing worker started – interval %ds",
        settings.PRICING_UPDATE_INTERVAL_SECONDS,
    )

    while True:
        try:
            for source in EnergySource:
                spot = get_spot_price(source)
                latest_prices[source.value] = {
                    "energy_source": source.value,
                    "price_per_kwh": spot.price_per_kwh,
                    "currency": spot.currency,
                    "timestamp": spot.timestamp.isoformat(),
                }

            logger.debug("Prices updated: %s", json.dumps(latest_prices, default=str))

        except Exception as exc:
            logger.exception("Pricing worker error: %s", exc)

        await asyncio.sleep(settings.PRICING_UPDATE_INTERVAL_SECONDS)


def start_pricing_worker() -> asyncio.Task:
    """Create and return the background pricing task."""
    return asyncio.create_task(pricing_loop())
