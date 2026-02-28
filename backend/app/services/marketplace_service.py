"""
Verdant Backend – Marketplace service (Part A)
Listing CRUD and buy-placeholder.
Contract creation is owned by Part B.
"""

from __future__ import annotations

from typing import Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.db.base import EnergySource, ListingStatus
from app.models.energy import EnergyListing
from app.models.producers import Producer
from app.models.users import User
from app.schemas.energy import (
    BuyEnergyRequest,
    BuyEnergyResponse,
    EnergyListingCreateRequest,
    EnergyListingListResponse,
    EnergyListingResponse,
)

logger = get_logger("services.marketplace")


def _listing_to_response(l: EnergyListing) -> EnergyListingResponse:
    return EnergyListingResponse(
        id=str(l.id),
        producer_id=str(l.producer_id),
        owner_id=str(l.owner_id),
        title=l.title,
        description=l.description,
        energy_source=l.energy_source,
        quantity_kwh=l.quantity_kwh,
        price_per_kwh=l.price_per_kwh,
        min_purchase_kwh=l.min_purchase_kwh,
        status=l.status,
        available_from=l.available_from,
        available_until=l.available_until,
        created_at=l.created_at,
        updated_at=l.updated_at,
    )


async def create_listing(
    payload: EnergyListingCreateRequest,
    current_user: User,
) -> EnergyListingResponse:
    """Create a new energy listing. Caller must own the referenced producer."""
    producer = await Producer.get(PydanticObjectId(payload.producer_id))
    if producer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producer not found",
        )
    if producer.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this producer profile",
        )

    listing = EnergyListing(
        producer_id=producer.id,
        owner_id=current_user.id,
        title=payload.title,
        description=payload.description,
        energy_source=payload.energy_source,
        quantity_kwh=payload.quantity_kwh,
        price_per_kwh=payload.price_per_kwh,
        min_purchase_kwh=payload.min_purchase_kwh,
        available_until=payload.available_until,
    )
    await listing.insert()
    logger.info("Listing created: %s (producer=%s)", listing.title, producer.company_name)
    return _listing_to_response(listing)


async def list_listings(
    energy_source: Optional[EnergySource] = None,
    status_filter: Optional[ListingStatus] = None,
    skip: int = 0,
    limit: int = 50,
) -> EnergyListingListResponse:
    """Return paginated listings, optionally filtered."""
    conditions: dict = {}
    if energy_source is not None:
        conditions["energy_source"] = energy_source.value
    if status_filter is not None:
        conditions["status"] = status_filter.value

    total = await EnergyListing.find(conditions).count()
    items = await EnergyListing.find(conditions).skip(skip).limit(limit).to_list()
    return EnergyListingListResponse(
        total=total,
        items=[_listing_to_response(i) for i in items],
    )


async def get_listing(listing_id: str) -> EnergyListingResponse:
    listing = await EnergyListing.get(PydanticObjectId(listing_id))
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return _listing_to_response(listing)


async def buy_energy(
    payload: BuyEnergyRequest,
    buyer: User,
) -> BuyEnergyResponse:
    """
    Placeholder buy flow.

    Validates the listing then delegates contract creation to **Part B**.
    """
    listing = await EnergyListing.get(PydanticObjectId(payload.listing_id))
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Listing is not active (current status: {listing.status.value})",
        )

    if payload.quantity_kwh < listing.min_purchase_kwh:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum purchase is {listing.min_purchase_kwh} kWh",
        )

    if payload.quantity_kwh > listing.quantity_kwh:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds available supply",
        )

    # ── TODO: Part B service integration ──────────────────
    # contract = await contract_service.create_contract(
    #     buyer_id=buyer.id,
    #     listing_id=listing.id,
    #     quantity_kwh=payload.quantity_kwh,
    #     price_per_kwh=listing.price_per_kwh,
    # )
    # payment = await payment_service.initiate_payment(contract)
    # certificate = await certificate_service.issue(contract)
    # ──────────────────────────────────────────────────────

    logger.info(
        "Buy placeholder: user=%s listing=%s qty=%s kWh",
        buyer.email,
        str(listing.id),
        payload.quantity_kwh,
    )

    return BuyEnergyResponse(
        detail="Purchase request received. Contract creation pending (Part B integration).",
        listing_id=str(listing.id),
        quantity_kwh=payload.quantity_kwh,
    )
