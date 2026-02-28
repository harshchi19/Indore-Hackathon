from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
import uuid

from app.models.payments import PaymentDocument
from app.schemas.payments import (
    PaymentInitiate,
    PaymentResponse,
    PaymentWebhook,
    EscrowAction,
    EscrowActionResponse,
    SettlementPayoutResponse
)


# In-memory store for testing
_payments_store: Dict[str, dict] = {}


class PaymentService:
    """Service for payment and escrow operations."""
    
    @staticmethod
    def _generate_id() -> str:
        return str(ObjectId())
    
    @staticmethod
    def _generate_transaction_id() -> str:
        """Generate unique transaction reference."""
        return f"TXN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8].upper()}"
    
    @staticmethod
    async def initiate_payment(data: PaymentInitiate) -> PaymentResponse:
        """Initiate a new payment."""
        payment_id = PaymentService._generate_id()
        now = datetime.utcnow()
        
        payment = PaymentDocument(
            id=ObjectId(payment_id),
            contract_id=ObjectId(data.contract_id),
            buyer_id=ObjectId(data.buyer_id),
            producer_id=ObjectId(data.producer_id),
            amount=data.amount,
            currency=data.currency,
            status="pending",
            escrow_lock=False,
            payment_method=data.payment_method,
            transaction_id=PaymentService._generate_transaction_id(),
            created_at=now,
            updated_at=now
        )
        
        payment_data = payment.to_mongo()
        payment_data["_id"] = payment_id
        _payments_store[payment_id] = payment_data
        
        return PaymentService._to_response(payment_data)
    
    @staticmethod
    async def get_payment(payment_id: str) -> PaymentResponse:
        """Get payment by ID."""
        payment = _payments_store.get(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_id} not found"
            )
        return PaymentService._to_response(payment)
    
    @staticmethod
    async def get_by_contract(contract_id: str) -> Optional[PaymentResponse]:
        """Get payment by contract ID."""
        for payment in _payments_store.values():
            if str(payment.get("contract_id")) == contract_id:
                return PaymentService._to_response(payment)
        return None
    
    @staticmethod
    async def list_payments(
        buyer_id: Optional[str] = None,
        producer_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """List payments with filters."""
        payments = list(_payments_store.values())
        
        if buyer_id:
            payments = [p for p in payments if str(p.get("buyer_id")) == buyer_id]
        if producer_id:
            payments = [p for p in payments if str(p.get("producer_id")) == producer_id]
        if status_filter:
            payments = [p for p in payments if p.get("status") == status_filter]
        
        total = len(payments)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = payments[start:end]
        
        return {
            "payments": [PaymentService._to_response(p) for p in paginated],
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    @staticmethod
    async def escrow_action(data: EscrowAction) -> EscrowActionResponse:
        """Perform escrow action (lock, release, refund)."""
        payment = _payments_store.get(data.payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {data.payment_id} not found"
            )
        
        now = datetime.utcnow()
        
        if data.action == "lock":
            if payment.get("escrow_lock"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Funds already locked in escrow"
                )
            payment["escrow_lock"] = True
            payment["escrow_locked_at"] = now
            payment["status"] = "escrow"
            message = "Funds locked in escrow"
            
        elif data.action == "release":
            if not payment.get("escrow_lock"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No funds in escrow to release"
                )
            payment["escrow_lock"] = False
            payment["escrow_released_at"] = now
            payment["status"] = "completed"
            message = "Escrow funds released to producer"
            
        elif data.action == "refund":
            if not payment.get("escrow_lock"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No funds in escrow to refund"
                )
            payment["escrow_lock"] = False
            payment["escrow_released_at"] = now
            payment["status"] = "refunded"
            message = "Escrow funds refunded to buyer"
        
        payment["updated_at"] = now
        _payments_store[data.payment_id] = payment
        
        return EscrowActionResponse(
            payment_id=data.payment_id,
            action=data.action,
            success=True,
            new_status=payment["status"],
            timestamp=now,
            message=message
        )
    
    @staticmethod
    async def process_webhook(data: PaymentWebhook) -> PaymentResponse:
        """Process payment webhook from external provider."""
        # Find payment by transaction ID
        payment = None
        payment_id = None
        for pid, p in _payments_store.items():
            if p.get("transaction_id") == data.transaction_id:
                payment = p
                payment_id = pid
                break
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with transaction {data.transaction_id} not found"
            )
        
        now = datetime.utcnow()
        
        # Update payment based on webhook status
        if data.status == "success":
            payment["status"] = "escrow" if payment.get("escrow_lock") else "completed"
        elif data.status == "failed":
            payment["status"] = "failed"
            payment["failure_reason"] = data.failure_reason
        
        payment["webhook_received"] = True
        payment["webhook_payload"] = data.model_dump()
        payment["updated_at"] = now
        
        _payments_store[payment_id] = payment
        return PaymentService._to_response(payment)
    
    @staticmethod
    async def simulate_settlement_payout(
        payment_id: str,
        payout_account: Optional[str] = None
    ) -> SettlementPayoutResponse:
        """Simulate settlement payout to producer."""
        payment = _payments_store.get(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_id} not found"
            )
        
        if payment.get("status") not in ["escrow", "pending"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot settle payment in status: {payment.get('status')}"
            )
        
        now = datetime.utcnow()
        
        # Simulate payout
        payment["escrow_lock"] = False
        payment["escrow_released_at"] = now
        payment["status"] = "completed"
        payment["updated_at"] = now
        
        _payments_store[payment_id] = payment
        
        return SettlementPayoutResponse(
            payment_id=payment_id,
            contract_id=str(payment["contract_id"]),
            amount=payment["amount"],
            currency=payment.get("currency", "INR"),
            payout_status="completed",
            payout_timestamp=now,
            message=f"Settlement payout of {payment['amount']} {payment.get('currency', 'INR')} completed"
        )
    
    @staticmethod
    def _to_response(payment: dict) -> PaymentResponse:
        return PaymentResponse(
            _id=str(payment["_id"]),
            contract_id=str(payment["contract_id"]),
            buyer_id=str(payment["buyer_id"]),
            producer_id=str(payment["producer_id"]),
            amount=payment["amount"],
            currency=payment.get("currency", "INR"),
            status=payment["status"],
            escrow_lock=payment.get("escrow_lock", False),
            escrow_locked_at=payment.get("escrow_locked_at"),
            escrow_released_at=payment.get("escrow_released_at"),
            payment_method=payment.get("payment_method"),
            transaction_id=payment.get("transaction_id"),
            failure_reason=payment.get("failure_reason"),
            created_at=payment["created_at"],
            updated_at=payment["updated_at"]
        )


payment_service = PaymentService()
