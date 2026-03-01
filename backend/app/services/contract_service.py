"""
Verdant Backend – Contract service (Part B)
Business logic for contract lifecycle: create → sign → settle.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.models.contracts import Contract, ContractStatus, ContractType
from app.schemas.contracts import (
    ContractCreateRequest,
    ContractListResponse,
    ContractResponse,
    ContractSignRequest,
)

logger = get_logger("services.contract")


def _contract_to_response(c: Contract) -> ContractResponse:
    return ContractResponse(
        id=str(c.id),
        buyer_id=str(c.buyer_id),
        producer_id=str(c.producer_id),
        listing_id=str(c.listing_id) if c.listing_id else None,
        volume_kwh=c.volume_kwh,
        price_per_kwh=c.price_per_kwh,
        total_amount=c.total_amount,
        contract_type=c.contract_type,
        status=c.status,
        contract_hash=c.contract_hash,
        signature_buyer=c.signature_buyer,
        signature_producer=c.signature_producer,
        settled_at=c.settled_at,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _generate_contract_hash(contract: Contract) -> str:
    """SHA-256 hash of the canonical contract payload."""
    payload = {
        "buyer_id": str(contract.buyer_id),
        "producer_id": str(contract.producer_id),
        "volume_kwh": contract.volume_kwh,
        "price_per_kwh": contract.price_per_kwh,
        "total_amount": contract.total_amount,
        "contract_type": contract.contract_type.value,
        "created_at": contract.created_at.isoformat(),
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def create_contract(payload: ContractCreateRequest) -> ContractResponse:
    """Create a new contract and generate its digital hash."""
    total = round(payload.volume_kwh * payload.price_per_kwh, 6)

    contract = Contract(
        buyer_id=PydanticObjectId(payload.buyer_id),
        producer_id=PydanticObjectId(payload.producer_id),
        listing_id=PydanticObjectId(payload.listing_id) if payload.listing_id else None,
        volume_kwh=payload.volume_kwh,
        price_per_kwh=payload.price_per_kwh,
        total_amount=total,
        contract_type=payload.contract_type,
    )
    await contract.insert()

    # Generate and persist hash
    contract.contract_hash = _generate_contract_hash(contract)
    await contract.save()

    logger.info(
        "Contract created: %s | buyer=%s producer=%s | %s kWh @ %s",
        str(contract.id),
        payload.buyer_id,
        payload.producer_id,
        payload.volume_kwh,
        payload.price_per_kwh,
    )
    return _contract_to_response(contract)


async def get_contract(contract_id: str) -> ContractResponse:
    contract = await Contract.get(PydanticObjectId(contract_id))
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return _contract_to_response(contract)


async def list_contracts(
    buyer_id: Optional[str] = None,
    producer_id: Optional[str] = None,
    status_filter: Optional[ContractStatus] = None,
    skip: int = 0,
    limit: int = 50,
) -> ContractListResponse:
    conditions: dict = {}
    if buyer_id:
        conditions["buyer_id"] = PydanticObjectId(buyer_id)
    if producer_id:
        conditions["producer_id"] = PydanticObjectId(producer_id)
    if status_filter:
        conditions["status"] = status_filter.value

    total = await Contract.find(conditions).count()
    items = await Contract.find(conditions).sort("-created_at").skip(skip).limit(limit).to_list()
    return ContractListResponse(
        total=total,
        items=[_contract_to_response(c) for c in items],
    )


async def sign_contract(contract_id: str, payload: ContractSignRequest) -> ContractResponse:
    """Record buyer or producer signature on the contract."""
    contract = await Contract.get(PydanticObjectId(contract_id))
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if contract.status not in (ContractStatus.PENDING, ContractStatus.ACTIVE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot sign contract in '{contract.status.value}' state",
        )

    if payload.role == "buyer":
        contract.signature_buyer = True
    elif payload.role == "producer":
        contract.signature_producer = True

    # Auto-activate when both parties have signed
    if contract.signature_buyer and contract.signature_producer:
        contract.status = ContractStatus.ACTIVE
        logger.info("Contract %s activated (both parties signed)", str(contract.id))

    await contract.save()
    return _contract_to_response(contract)


async def settle_contract(contract_id: str) -> ContractResponse:
    """
    T+1 mock settlement: transition contract to SETTLED.
    Triggers downstream certificate issuance (async worker).
    """
    contract = await Contract.get(PydanticObjectId(contract_id))
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if contract.status != ContractStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only active contracts can be settled (current: {contract.status.value})",
        )

    contract.status = ContractStatus.SETTLED
    contract.settled_at = datetime.now(timezone.utc).isoformat()
    await contract.save()

    logger.info("Contract %s settled", str(contract.id))

    # Trigger async certificate issuance
    try:
        from app.workers.certificate_worker import enqueue_certificate_issuance

        await enqueue_certificate_issuance(str(contract.id))
    except Exception as exc:
        logger.warning("Certificate worker enqueue failed (non-blocking): %s", exc)

    return _contract_to_response(contract)


async def dispute_contract(contract_id: str) -> ContractResponse:
    """Mark contract as disputed."""
    contract = await Contract.get(PydanticObjectId(contract_id))
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if contract.status == ContractStatus.SETTLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already settled – raise a dispute ticket instead",
        )

    contract.status = ContractStatus.DISPUTED
    await contract.save()
    logger.info("Contract %s marked as disputed", str(contract.id))
    return _contract_to_response(contract)
