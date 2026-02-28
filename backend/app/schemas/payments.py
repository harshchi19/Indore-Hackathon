"""
Verdant Backend – Payment schemas (Part B)
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.payments import PaymentStatus


class PaymentInitiateRequest(BaseModel):
    contract_id: str
    amount_eur: float = Field(..., gt=0)


class PaymentWebhookPayload(BaseModel):
    payment_id: str
    status: PaymentStatus
    transaction_ref: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    contract_id: str
    buyer_id: str
    amount_eur: float
    status: PaymentStatus
    escrow_lock: bool
    transaction_ref: Optional[str] = None
    settled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    total: int
    items: list[PaymentResponse]
