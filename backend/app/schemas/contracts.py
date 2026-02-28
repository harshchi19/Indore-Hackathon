"""
Verdant Backend – Contract schemas (Part B)
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.contracts import ContractStatus, ContractType


class ContractCreateRequest(BaseModel):
    buyer_id: str
    producer_id: str
    listing_id: Optional[str] = None
    volume_kwh: float = Field(..., gt=0)
    price_per_kwh: float = Field(..., gt=0)
    contract_type: ContractType = ContractType.SPOT


class ContractSignRequest(BaseModel):
    role: str = Field(..., pattern="^(buyer|producer)$")


class ContractStatusUpdateRequest(BaseModel):
    status: ContractStatus


class ContractResponse(BaseModel):
    id: str
    buyer_id: str
    producer_id: str
    listing_id: Optional[str] = None
    volume_kwh: float
    price_per_kwh: float
    total_amount: float
    contract_type: ContractType
    status: ContractStatus
    contract_hash: Optional[str] = None
    signature_buyer: bool
    signature_producer: bool
    settled_at: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ContractListResponse(BaseModel):
    total: int
    items: list[ContractResponse]
