"""
Verdant Backend – Payment service (Part B)
Payment initiation, escrow simulation, webhook handling, settlement payout.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.models.contracts import Contract, ContractStatus
from app.models.payments import Payment, PaymentStatus
from app.schemas.payments import (
    PaymentInitiateRequest,
    PaymentListResponse,
    PaymentResponse,
    PaymentWebhookPayload,
)

logger = get_logger("services.payment")


def _payment_to_response(p: Payment) -> PaymentResponse:
    return PaymentResponse(
        id=str(p.id),
        contract_id=str(p.contract_id),
        buyer_id=str(p.buyer_id),
        amount_eur=p.amount_eur,
        status=p.status,
        escrow_lock=p.escrow_lock,
        transaction_ref=p.transaction_ref,
        settled_at=p.settled_at,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


async def initiate_payment(payload: PaymentInitiateRequest, buyer_id: str) -> PaymentResponse:
    """Create a payment record with escrow lock for the given contract."""
    contract = await Contract.get(PydanticObjectId(payload.contract_id))
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if contract.status not in (ContractStatus.PENDING, ContractStatus.ACTIVE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pay for contract in '{contract.status.value}' state",
        )

    # Check for existing pending payment
    existing = await Payment.find_one(
        Payment.contract_id == contract.id,
        Payment.status == PaymentStatus.PENDING,
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending payment already exists for this contract",
        )

    payment = Payment(
        contract_id=contract.id,
        buyer_id=PydanticObjectId(buyer_id),
        amount_eur=payload.amount_eur,
        escrow_lock=True,
        transaction_ref=f"TXN-{uuid.uuid4().hex[:12].upper()}",
    )
    await payment.insert()

    logger.info(
        "Payment initiated: %s | contract=%s amount=€%.2f escrow=locked",
        str(payment.id),
        payload.contract_id,
        payload.amount_eur,
    )
    return _payment_to_response(payment)


async def handle_webhook(payload: PaymentWebhookPayload) -> PaymentResponse:
    """
    Process an external payment webhook (simulated).
    Updates payment status and triggers settlement if completed.
    """
    payment = await Payment.get(PydanticObjectId(payload.payment_id))
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment already in '{payment.status.value}' state",
        )

    payment.status = payload.status
    if payload.transaction_ref:
        payment.transaction_ref = payload.transaction_ref

    if payload.status == PaymentStatus.COMPLETED:
        payment.escrow_lock = False
        payment.settled_at = datetime.now(timezone.utc)

        # Auto-settle the contract
        contract = await Contract.get(payment.contract_id)
        if contract and contract.status == ContractStatus.ACTIVE:
            from app.services.contract_service import settle_contract

            await settle_contract(str(contract.id))
            logger.info("Contract %s auto-settled via payment webhook", str(contract.id))

    elif payload.status == PaymentStatus.FAILED:
        payment.escrow_lock = False

    await payment.save()
    logger.info("Payment %s updated via webhook → %s", str(payment.id), payload.status.value)
    return _payment_to_response(payment)


async def get_payment(payment_id: str) -> PaymentResponse:
    payment = await Payment.get(PydanticObjectId(payment_id))
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return _payment_to_response(payment)


async def list_payments(
    contract_id: Optional[str] = None,
    buyer_id: Optional[str] = None,
    status_filter: Optional[PaymentStatus] = None,
    skip: int = 0,
    limit: int = 50,
) -> PaymentListResponse:
    conditions: dict = {}
    if contract_id:
        conditions["contract_id"] = PydanticObjectId(contract_id)
    if buyer_id:
        conditions["buyer_id"] = PydanticObjectId(buyer_id)
    if status_filter:
        conditions["status"] = status_filter.value

    total = await Payment.find(conditions).count()
    items = await Payment.find(conditions).skip(skip).limit(limit).to_list()
    return PaymentListResponse(
        total=total,
        items=[_payment_to_response(p) for p in items],
    )


async def simulate_settlement_payout(contract_id: str) -> PaymentResponse:
    """
    Simulate settlement payout: find the pending payment for the contract,
    mark completed, release escrow, and settle the contract.
    """
    payment = await Payment.find_one(
        Payment.contract_id == PydanticObjectId(contract_id),
        Payment.status == PaymentStatus.PENDING,
    )
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending payment found for this contract",
        )

    payment.status = PaymentStatus.COMPLETED
    payment.escrow_lock = False
    payment.settled_at = datetime.now(timezone.utc)
    await payment.save()

    logger.info("Settlement payout simulated for contract %s", contract_id)
    return _payment_to_response(payment)
