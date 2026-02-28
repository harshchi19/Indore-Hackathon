"""
Verdant Backend – Analytics worker (Part B)
Periodic background task for carbon analytics aggregation.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.core.logging import get_logger

logger = get_logger("workers.analytics")

# Cache for latest dashboard snapshot
latest_dashboard: dict = {}

ANALYTICS_INTERVAL_SECONDS = 300  # 5 minutes


async def analytics_worker_loop() -> None:
    """
    Periodically recompute dashboard analytics and cache the result.
    """
    logger.info("Analytics worker started – interval %ds", ANALYTICS_INTERVAL_SECONDS)

    while True:
        try:
            from app.services.analytics_service import dashboard_summary, producer_performance

            dashboard = await dashboard_summary()
            top_producers = await producer_performance(top_n=10)

            latest_dashboard.update(
                {
                    "dashboard": dashboard,
                    "top_producers": top_producers,
                    "computed_at": datetime.now(timezone.utc).isoformat(),
                }
            )

            logger.debug("Analytics snapshot updated: %s", latest_dashboard.get("computed_at"))

        except Exception as exc:
            logger.error("Analytics worker error: %s", exc)

        await asyncio.sleep(ANALYTICS_INTERVAL_SECONDS)


def start_analytics_worker() -> asyncio.Task:
    """Create and return the background analytics worker task."""
    return asyncio.create_task(analytics_worker_loop())
