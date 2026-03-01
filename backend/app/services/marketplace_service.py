"""
Verdant Backend – Marketplace service (Part A + B integrated)
Listing CRUD and fully-implemented buy flow.
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
from app.schemas.contracts import ContractCreateRequest, ContractSignRequest
from app.schemas.payments import PaymentInitiateRequest
from app.services import contract_service, payment_service, wallet_service
from app.models.wallet import WalletTxnType

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
    try:
        producer_oid = PydanticObjectId(payload.producer_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid producer_id: must be a valid 24-character hex ObjectId",
        )
    producer = await Producer.get(producer_oid)
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
    Full buy flow:
      1. Validate listing (active, sufficient quantity)
      2. Create a contract (buyer ↔ listing owner)
      3. Auto-sign contract as buyer
      4. Initiate payment (escrow lock)
      5. Deduct quantity from listing; mark SOLD if fully consumed
    """
    # ── 1. Validate listing ────────────────────────────────
    try:
        listing_oid = PydanticObjectId(payload.listing_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Invalid listing_id")

    listing = await EnergyListing.get(listing_oid)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Listing not found")

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
            detail=f"Requested {payload.quantity_kwh} kWh exceeds available {listing.quantity_kwh} kWh",
        )

    if str(listing.owner_id) == str(buyer.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot purchase your own listing",
        )

    # ── 1b. Check buyer wallet balance ─────────────────────
    total_cost = round(payload.quantity_kwh * listing.price_per_kwh, 2)
    if buyer.wallet_balance < total_cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient wallet balance. Available: ₹{buyer.wallet_balance:.2f}, Required: ₹{total_cost:.2f}",
        )

    # ── 1c. Deduct buyer wallet balance ────────────────────
    await wallet_service.deduct_balance(str(buyer.id), total_cost, reference_id=str(listing.id))

    # ── Steps 2-5 wrapped in try/except for rollback ───────
    try:
        # ── 2. Create contract ─────────────────────────────
        contract_req = ContractCreateRequest(
            buyer_id=str(buyer.id),
            producer_id=str(listing.owner_id),
            listing_id=str(listing.id),
            volume_kwh=payload.quantity_kwh,
            price_per_kwh=listing.price_per_kwh,
        )
        contract_resp = await contract_service.create_contract(contract_req)

        # ── 3. Auto-sign as buyer ──────────────────────────
        try:
            await contract_service.sign_contract(
                contract_resp.id, ContractSignRequest(role="buyer")
            )
        except Exception as exc:
            logger.warning("Auto-sign failed (non-blocking): %s", exc)

        # ── 4. Initiate payment ────────────────────────────
        payment_req = PaymentInitiateRequest(
            contract_id=contract_resp.id,
            amount_eur=contract_resp.total_amount,
        )
        payment_resp = await payment_service.initiate_payment(payment_req, str(buyer.id))

        # ── 5. Deduct quantity / mark listing status ───────
        listing.quantity_kwh = round(listing.quantity_kwh - payload.quantity_kwh, 6)
        if listing.quantity_kwh <= 0:
            listing.status = ListingStatus.SOLD
            listing.quantity_kwh = 0.0
        await listing.save()

    except HTTPException:
        # Re-raise HTTP exceptions (4xx errors from sub-services) after rollback
        await wallet_service.credit_balance(
            str(buyer.id), total_cost,
            txn_type=WalletTxnType.REFUND,
            reference_id=str(listing.id),
            description=f"Refund – purchase of {payload.quantity_kwh} kWh failed",
        )
        logger.warning("Buy flow failed (HTTP error) – refunded ₹%.2f to user %s", total_cost, buyer.email)
        raise
    except Exception as exc:
        # Rollback wallet deduction on unexpected errors
        await wallet_service.credit_balance(
            str(buyer.id), total_cost,
            txn_type=WalletTxnType.REFUND,
            reference_id=str(listing.id),
            description=f"Refund – purchase of {payload.quantity_kwh} kWh failed",
        )
        logger.error("Buy flow failed – refunded ₹%.2f to user %s: %s", total_cost, buyer.email, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Purchase failed due to an internal error. Your wallet has been refunded.",
        )

    logger.info(
        "Buy completed: user=%s listing=%s qty=%s kWh → contract=%s payment=%s txn=%s",
        buyer.email,
        str(listing.id),
        payload.quantity_kwh,
        contract_resp.id,
        payment_resp.id,
        payment_resp.transaction_ref,
    )

    return BuyEnergyResponse(
        detail="Purchase successful. Contract created and payment escrowed.",
        listing_id=str(listing.id),
        quantity_kwh=payload.quantity_kwh,
        contract_id=contract_resp.id,
        payment_id=payment_resp.id,
        transaction_ref=payment_resp.transaction_ref or "",
        total_amount=contract_resp.total_amount,
    )
