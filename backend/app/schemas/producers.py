"""
Verdant Backend – Producer schemas (Part A)
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.db.base import EnergySource, ProducerStatus


class ProducerCreateRequest(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    energy_sources: List[EnergySource] = Field(..., min_length=1)
    capacity_kw: float = Field(..., gt=0)
    location: str = Field(..., min_length=1, max_length=300)


class ProducerResponse(BaseModel):
    id: str
    owner_id: str
    company_name: str
    description: Optional[str] = None
    energy_sources: List[EnergySource]
    capacity_kw: float
    location: str
    status: ProducerStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProducerListResponse(BaseModel):
    total: int
    items: List[ProducerResponse]
