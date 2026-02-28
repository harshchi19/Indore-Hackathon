from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from app.core.object_id import PyObjectId


class PaymentDocument(BaseModel):
    """MongoDB Payment Document Model."""
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    contract_id: PyObjectId
    buyer_id: PyObjectId
    producer_id: PyObjectId
    amount: float = Field(..., gt=0, description="Payment amount")
    currency: str = Field(default="INR", description="Currency code")
    status: Literal["pending", "escrow", "completed", "failed", "refunded"] = Field(default="pending")
    escrow_lock: bool = Field(default=False, description="Whether funds are in escrow")
    escrow_locked_at: Optional[datetime] = Field(default=None)
    escrow_released_at: Optional[datetime] = Field(default=None)
    payment_method: Optional[str] = Field(default=None, description="Payment method used")
    transaction_id: Optional[str] = Field(default=None, description="External transaction reference")
    webhook_received: bool = Field(default=False)
    webhook_payload: Optional[dict] = Field(default=None)
    failure_reason: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str}
    
    def to_mongo(self) -> dict:
        """Convert to MongoDB document format."""
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and data["_id"] is None:
            del data["_id"]
        return data


class EscrowTransaction(BaseModel):
    """Escrow transaction record (embedded in payments)."""
    
    action: Literal["lock", "release", "refund"]
    amount: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    initiated_by: str
    notes: Optional[str] = Field(default=None)
