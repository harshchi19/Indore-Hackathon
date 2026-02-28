"""
Verdant Backend – Certificate document model (Part B)
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from pydantic import Field

from app.db.base import EnergySource, TimestampedDocument


class Certificate(TimestampedDocument):
    """Immutable I-REC / G-GO style green energy certificate."""

    contract_id: PydanticObjectId
    producer_id: PydanticObjectId
    buyer_id: PydanticObjectId
    energy_source: EnergySource
    energy_amount_kwh: float = Field(..., gt=0)
    certificate_hash: Optional[str] = None  # SHA-256 hex
    issued_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    valid: bool = True

    class Settings:
        name = "certificates"
        use_state_management = True
        indexes = [
            "contract_id",
            "producer_id",
            "buyer_id",
            "valid",
        ]
