"""
Verdant Backend – Producer service (Part A)
Business logic for producer CRUD and verification.
"""

from __future__ import annotations

from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.db.base import ProducerStatus
from app.models.producers import Producer
from app.models.users import User
from app.schemas.producers import (
    ProducerCreateRequest,
    ProducerListResponse,
    ProducerResponse,
)

logger = get_logger("services.producer")


def _producer_to_response(p: Producer) -> ProducerResponse:
    return ProducerResponse(
        id=str(p.id),
        owner_id=str(p.owner_id),
        company_name=p.company_name,
        description=p.description,
        energy_sources=p.energy_sources,
        capacity_kw=p.capacity_kw,
        location=p.location,
        status=p.status,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


async def create_producer(
    payload: ProducerCreateRequest,
    current_user: User,
) -> ProducerResponse:
    """Create a new producer profile owned by *current_user*."""
    producer = Producer(
        owner_id=current_user.id,
        company_name=payload.company_name,
        description=payload.description,
        energy_sources=payload.energy_sources,
        capacity_kw=payload.capacity_kw,
        location=payload.location,
    )
    await producer.insert()
    logger.info("Producer created: %s (owner=%s)", producer.company_name, current_user.email)
    return _producer_to_response(producer)


async def list_producers(
    status_filter: Optional[ProducerStatus] = None,
    owner_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> ProducerListResponse:
    """Return paginated list of producers, optionally filtered by status or owner."""
    query = {}
    if status_filter is not None:
        query["status"] = status_filter.value
    if owner_id is not None:
        try:
            query["owner_id"] = PydanticObjectId(owner_id)
        except Exception:
            pass  # ignore invalid owner_id

    total = await Producer.find(query).count()
    items = await Producer.find(query).skip(skip).limit(limit).to_list()
    return ProducerListResponse(
        total=total,
        items=[_producer_to_response(p) for p in items],
    )


async def get_producer(producer_id: str) -> ProducerResponse:
    producer = await Producer.get(PydanticObjectId(producer_id))
    if producer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer not found")
    return _producer_to_response(producer)


async def verify_producer(
    producer_id: str,
    admin_user: User,
) -> ProducerResponse:
    """Admin-only: mark a producer as verified."""
    producer = await Producer.get(PydanticObjectId(producer_id))
    if producer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer not found")

    producer.status = ProducerStatus.VERIFIED
    producer.verified_by = admin_user.id
    await producer.save()

    logger.info("Producer verified: %s by admin %s", producer.company_name, admin_user.email)
    return _producer_to_response(producer)
