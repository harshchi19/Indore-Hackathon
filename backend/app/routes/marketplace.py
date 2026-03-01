"""
Verdant Backend – Marketplace routes (Part A)
Producers, energy listings, and buy placeholder.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import _get_current_user, require_roles
from app.db.base import EnergySource, ListingStatus, ProducerStatus
from app.models.users import User
from app.schemas.energy import (
    BuyEnergyRequest,
    BuyEnergyResponse,
    EnergyListingCreateRequest,
    EnergyListingListResponse,
    EnergyListingResponse,
)
from app.schemas.producers import (
    ProducerCreateRequest,
    ProducerListResponse,
    ProducerResponse,
)
from app.services import marketplace_service, producer_service

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


# ── Producers ───────────────────────────────────────────────
@router.post(
    "/producers",
    response_model=ProducerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new energy producer",
)
async def create_producer(
    payload: ProducerCreateRequest,
    current_user: User = Depends(_get_current_user),
) -> ProducerResponse:
    return await producer_service.create_producer(payload, current_user)


@router.get(
    "/producers",
    response_model=ProducerListResponse,
    summary="List producers",
)
async def list_producers(
    status_filter: Optional[ProducerStatus] = Query(default=None, alias="status"),
    owner_id: Optional[str] = Query(default=None, description="Filter by owner user ID"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> ProducerListResponse:
    return await producer_service.list_producers(status_filter, owner_id, skip, limit)


@router.get(
    "/producers/{producer_id}",
    response_model=ProducerResponse,
    summary="Get producer details",
)
async def get_producer(producer_id: str) -> ProducerResponse:
    return await producer_service.get_producer(producer_id)


@router.patch(
    "/producers/{producer_id}/verify",
    response_model=ProducerResponse,
    summary="Verify a producer (admin only)",
    dependencies=[Depends(require_roles(["admin"]))],
)
async def verify_producer(
    producer_id: str,
    admin_user: User = Depends(_get_current_user),
) -> ProducerResponse:
    return await producer_service.verify_producer(producer_id, admin_user)


# ── Energy Listings ─────────────────────────────────────────
@router.post(
    "/listings",
    response_model=EnergyListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new energy listing",
)
async def create_listing(
    payload: EnergyListingCreateRequest,
    current_user: User = Depends(_get_current_user),
) -> EnergyListingResponse:
    return await marketplace_service.create_listing(payload, current_user)


@router.get(
    "/listings",
    response_model=EnergyListingListResponse,
    summary="Browse energy listings",
)
async def list_listings(
    energy_source: Optional[EnergySource] = Query(default=None),
    status_filter: Optional[ListingStatus] = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> EnergyListingListResponse:
    return await marketplace_service.list_listings(energy_source, status_filter, skip, limit)


@router.get(
    "/listings/{listing_id}",
    response_model=EnergyListingResponse,
    summary="Get listing detail",
)
async def get_listing(listing_id: str) -> EnergyListingResponse:
    return await marketplace_service.get_listing(listing_id)


# ── Buy (placeholder → Part B) ─────────────────────────────
@router.post(
    "/buy",
    response_model=BuyEnergyResponse,
    summary="Purchase energy (placeholder – Part B integration pending)",
)
async def buy_energy(
    payload: BuyEnergyRequest,
    current_user: User = Depends(_get_current_user),
) -> BuyEnergyResponse:
    return await marketplace_service.buy_energy(payload, current_user)
