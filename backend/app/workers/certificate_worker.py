"""
Verdant Backend – Certificate worker (Part B)
Async background task that issues certificates for settled contracts.
"""

from __future__ import annotations

import asyncio

from app.core.logging import get_logger
from app.db.base import EnergySource

logger = get_logger("workers.certificate")

# Simple in-memory queue for certificate issuance tasks
_certificate_queue: asyncio.Queue[str] = asyncio.Queue()


async def enqueue_certificate_issuance(contract_id: str) -> None:
    """Add a contract to the certificate issuance queue."""
    await _certificate_queue.put(contract_id)
    logger.info("Certificate issuance enqueued for contract %s", contract_id)


async def certificate_worker_loop() -> None:
    """
    Continuously process certificate issuance requests from the queue.
    Start as an asyncio.Task at application startup.
    """
    logger.info("Certificate worker started")

    while True:
        try:
            contract_id = await asyncio.wait_for(_certificate_queue.get(), timeout=5.0)
        except asyncio.TimeoutError:
            continue
        except Exception:
            await asyncio.sleep(1)
            continue

        try:
            from app.services.certificate_service import issue_for_contract

            cert = await issue_for_contract(contract_id)
            logger.info(
                "Certificate auto-issued: %s for contract %s",
                cert.id,
                contract_id,
            )
        except Exception as exc:
            logger.error(
                "Certificate issuance failed for contract %s: %s",
                contract_id,
                exc,
            )

        _certificate_queue.task_done()


def start_certificate_worker() -> asyncio.Task:
    """Create and return the background certificate worker task."""
    return asyncio.create_task(certificate_worker_loop())
