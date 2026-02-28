from fastapi import APIRouter, Query, status
from typing import Optional

from app.schemas.payments import (
    PaymentInitiate,
    PaymentResponse,
    PaymentWebhook,
    EscrowAction,
    EscrowActionResponse,
    PaymentListResponse,
    SettlementPayoutRequest,
    SettlementPayoutResponse
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a payment"
)
async def initiate_payment(data: PaymentInitiate):
    """
    Initiate a new payment.
    
    - Creates payment record
    - Generates transaction ID
    - Status starts as 'pending'
    """
    return await PaymentService.initiate_payment(data)


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
    summary="Get payment by ID"
)
async def get_payment(payment_id: str):
    """Get payment details by ID."""
    return await PaymentService.get_payment(payment_id)


@router.get(
    "/by-contract/{contract_id}",
    response_model=PaymentResponse,
    summary="Get payment by contract ID"
)
async def get_payment_by_contract(contract_id: str):
    """Get payment for a specific contract."""
    result = await PaymentService.get_by_contract(contract_id)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No payment found for contract {contract_id}"
        )
    return result


@router.get(
    "/",
    response_model=PaymentListResponse,
    summary="List payments"
)
async def list_payments(
    buyer_id: Optional[str] = Query(None, description="Filter by buyer ID"),
    producer_id: Optional[str] = Query(None, description="Filter by producer ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List payments with optional filters."""
    return await PaymentService.list_payments(
        buyer_id=buyer_id,
        producer_id=producer_id,
        status_filter=status,
        page=page,
        page_size=page_size
    )


@router.post(
    "/escrow",
    response_model=EscrowActionResponse,
    summary="Perform escrow action"
)
async def escrow_action(data: EscrowAction):
    """
    Perform an escrow action.
    
    Actions:
    - lock: Lock funds in escrow
    - release: Release escrow to producer
    - refund: Refund escrow to buyer
    """
    return await PaymentService.escrow_action(data)


@router.post(
    "/webhook",
    response_model=PaymentResponse,
    summary="Process payment webhook"
)
async def process_webhook(data: PaymentWebhook):
    """
    Process payment webhook from external provider.
    
    - Updates payment status based on webhook payload
    - Records webhook data
    """
    return await PaymentService.process_webhook(data)


@router.post(
    "/settle",
    response_model=SettlementPayoutResponse,
    summary="Simulate settlement payout"
)
async def settlement_payout(data: SettlementPayoutRequest):
    """
    Simulate settlement payout to producer.
    
    - Releases escrow if locked
    - Marks payment as completed
    """
    return await PaymentService.simulate_settlement_payout(
        payment_id=data.payment_id,
        payout_account=data.payout_account
    )


@router.post(
    "/{payment_id}/escrow/lock",
    response_model=EscrowActionResponse,
    summary="Lock funds in escrow"
)
async def lock_escrow(payment_id: str, initiated_by: str = Query(...)):
    """Shorthand to lock funds in escrow."""
    return await PaymentService.escrow_action(
        EscrowAction(
            payment_id=payment_id,
            action="lock",
            initiated_by=initiated_by
        )
    )


@router.post(
    "/{payment_id}/escrow/release",
    response_model=EscrowActionResponse,
    summary="Release escrow to producer"
)
async def release_escrow(payment_id: str, initiated_by: str = Query(...)):
    """Shorthand to release escrow funds."""
    return await PaymentService.escrow_action(
        EscrowAction(
            payment_id=payment_id,
            action="release",
            initiated_by=initiated_by
        )
    )
