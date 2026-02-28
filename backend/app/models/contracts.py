"""
Verdant Backend – Contract document model (Part B)
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from beanie import PydanticObjectId
from pydantic import Field

from app.db.base import TimestampedDocument


class ContractType(str, Enum):
    SPOT = "spot"
    SCHEDULED = "scheduled"


class ContractStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SETTLED = "settled"
    DISPUTED = "disputed"


class Contract(TimestampedDocument):
    """MongoDB document for energy trade contracts."""

    buyer_id: PydanticObjectId
    producer_id: PydanticObjectId
    listing_id: Optional[PydanticObjectId] = None
    volume_kwh: float = Field(..., gt=0)
    price_per_kwh: float = Field(..., gt=0)
    total_amount: float = Field(default=0.0)
    contract_type: ContractType = ContractType.SPOT
    status: ContractStatus = ContractStatus.PENDING
    contract_hash: Optional[str] = None  # SHA-256 hex digest
    signature_buyer: bool = False
    signature_producer: bool = False
    settled_at: Optional[str] = None

    class Settings:
        name = "contracts"
        use_state_management = True
        indexes = [
            "buyer_id",
            "producer_id",
            "status",
        ]
