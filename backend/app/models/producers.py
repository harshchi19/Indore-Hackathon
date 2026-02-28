"""
Verdant Backend – Producer document model (Part A)
"""

from __future__ import annotations

from typing import List, Optional

from beanie import PydanticObjectId
from pydantic import Field

from app.db.base import EnergySource, ProducerStatus, TimestampedDocument


class Producer(TimestampedDocument):
    """MongoDB document for energy producers."""

    owner_id: PydanticObjectId  # references User._id
    company_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    energy_sources: List[EnergySource] = Field(default_factory=list)
    capacity_kw: float = Field(..., gt=0, description="Installed capacity in kW")
    location: str = Field(..., min_length=1, max_length=300)
    status: ProducerStatus = ProducerStatus.PENDING
    verified_by: Optional[PydanticObjectId] = None  # admin who verified

    class Settings:
        name = "producers"
        use_state_management = True
        indexes = [
            "owner_id",
            "status",
        ]
