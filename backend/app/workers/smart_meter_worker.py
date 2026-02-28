"""
Verdant Backend – Smart Meter worker (Part B)
Async background processor for meter reading events.
"""

from __future__ import annotations

import asyncio

from app.core.logging import get_logger

logger = get_logger("workers.smart_meter")

# In-memory event queue for meter reading events
_meter_event_queue: asyncio.Queue[dict] = asyncio.Queue()


async def enqueue_meter_event(event: dict) -> None:
    """Push a meter reading event onto the processing queue."""
    await _meter_event_queue.put(event)
    logger.debug("Meter event enqueued: device=%s", event.get("device_id"))


async def smart_meter_worker_loop() -> None:
    """
    Process meter reading events asynchronously.
    In production this would push to a message broker for downstream consumers.
    """
    logger.info("Smart meter worker started")

    while True:
        try:
            event = await asyncio.wait_for(_meter_event_queue.get(), timeout=5.0)
        except asyncio.TimeoutError:
            continue
        except Exception:
            await asyncio.sleep(1)
            continue

        try:
            device_id = event.get("device_id", "unknown")
            reading_kwh = event.get("reading_kwh", 0)
            status = event.get("status", "synced")

            if status == "anomaly":
                logger.warning(
                    "Anomaly event processed – device=%s reading=%.2f reason=%s",
                    device_id,
                    reading_kwh,
                    event.get("anomaly_reason", "N/A"),
                )
            else:
                logger.debug(
                    "Meter event processed – device=%s reading=%.2f kWh",
                    device_id,
                    reading_kwh,
                )

        except Exception as exc:
            logger.error("Smart meter worker error: %s", exc)

        _meter_event_queue.task_done()


def start_smart_meter_worker() -> asyncio.Task:
    """Create and return the background smart meter worker task."""
    return asyncio.create_task(smart_meter_worker_loop())
