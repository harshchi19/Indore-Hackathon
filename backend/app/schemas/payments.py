from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class PaymentInitiate(BaseModel):
    """Schema for initiating a payment."""
    
    contract_id: str = Field(..., description="Contract ID")
    buyer_id: str = Field(..., description="Buyer user ID")
    producer_id: str = Field(..., description="Producer ID")
    amount: float = Field(..., gt=0, description="Payment amount")
    currency: str = Field(default="INR", description="Currency code")
    payment_method: Optional[str] = Field(default="bank_transfer")


class PaymentResponse(BaseModel):
    """Schema for payment response."""
    
    id: str = Field(..., alias="_id")
    contract_id: str
    buyer_id: str
    producer_id: str
    amount: float
    currency: str
    status: str
    escrow_lock: bool
    escrow_locked_at: Optional[datetime] = None
    escrow_released_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True


class PaymentWebhook(BaseModel):
    """Schema for payment webhook payload."""
    
    transaction_id: str = Field(..., description="External transaction ID")
    status: Literal["success", "failed", "pending"] = Field(...)
    amount: float
    currency: str = Field(default="INR")
    payment_method: Optional[str] = None
    failure_reason: Optional[str] = None
    metadata: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class EscrowAction(BaseModel):
    """Schema for escrow actions."""
    
    payment_id: str = Field(..., description="Payment ID")
    action: Literal["lock", "release", "refund"] = Field(...)
    initiated_by: str = Field(..., description="User ID initiating action")
    notes: Optional[str] = None


class EscrowActionResponse(BaseModel):
    """Schema for escrow action response."""
    
    payment_id: str
    action: str
    success: bool
    new_status: str
    timestamp: datetime
    message: str


class PaymentListResponse(BaseModel):
    """Schema for listing payments."""
    
    payments: List[PaymentResponse]
    total: int
    page: int
    page_size: int


class SettlementPayoutRequest(BaseModel):
    """Schema for settlement payout simulation."""
    
    payment_id: str = Field(..., description="Payment ID to settle")
    payout_account: Optional[str] = Field(default=None, description="Producer payout account")


class SettlementPayoutResponse(BaseModel):
    """Schema for settlement payout response."""
    
    payment_id: str
    contract_id: str
    amount: float
    currency: str
    payout_status: str
    payout_timestamp: datetime
    message: str
