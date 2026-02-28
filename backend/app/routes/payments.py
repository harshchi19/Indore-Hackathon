"""
Verdant Backend – Payment routes (Part B)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import _get_current_user
from app.models.payments import PaymentStatus
from app.models.users import User
from app.schemas.payments import (
    PaymentInitiateRequest,
    PaymentListResponse,
    PaymentResponse,
    PaymentWebhookPayload,
)
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a payment with escrow lock",
)
async def initiate_payment(
    payload: PaymentInitiateRequest,
    current_user: User = Depends(_get_current_user),
) -> PaymentResponse:
    return await payment_service.initiate_payment(payload, buyer_id=str(current_user.id))


@router.get(
    "",
    response_model=PaymentListResponse,
    summary="List payments",
)
async def list_payments(
    contract_id: Optional[str] = Query(default=None),
    buyer_id: Optional[str] = Query(default=None),
    status_filter: Optional[PaymentStatus] = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(_get_current_user),
) -> PaymentListResponse:
    return await payment_service.list_payments(contract_id, buyer_id, status_filter, skip, limit)


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
    summary="Get payment details",
)
async def get_payment(
    payment_id: str,
    current_user: User = Depends(_get_current_user),
) -> PaymentResponse:
    return await payment_service.get_payment(payment_id)


@router.post(
    "/webhook",
    response_model=PaymentResponse,
    summary="Payment provider webhook (simulated)",
)
async def payment_webhook(payload: PaymentWebhookPayload) -> PaymentResponse:
    return await payment_service.handle_webhook(payload)


@router.post(
    "/{contract_id}/settle",
    response_model=PaymentResponse,
    summary="Simulate settlement payout for a contract",
)
async def settlement_payout(
    contract_id: str,
    current_user: User = Depends(_get_current_user),
) -> PaymentResponse:
    return await payment_service.simulate_settlement_payout(contract_id)
