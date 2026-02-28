"""
Verdant Backend – Payment document model (Part B)
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import PydanticObjectId
from pydantic import Field

from app.db.base import TimestampedDocument


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class Payment(TimestampedDocument):
    """MongoDB document for payment records."""

    contract_id: PydanticObjectId
    buyer_id: PydanticObjectId
    amount_eur: float = Field(..., gt=0)
    status: PaymentStatus = PaymentStatus.PENDING
    escrow_lock: bool = False
    transaction_ref: Optional[str] = None
    settled_at: Optional[datetime] = None

    class Settings:
        name = "payments"
        use_state_management = True
        indexes = [
            "contract_id",
            "buyer_id",
            "status",
        ]
