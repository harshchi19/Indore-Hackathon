"""
Verdant Backend – Certificate schemas (Part B)
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.db.base import EnergySource


class CertificateIssueRequest(BaseModel):
    contract_id: str
    energy_source: EnergySource
    validity_days: int = 365


class CertificateVerifyRequest(BaseModel):
    certificate_id: str


class CertificateResponse(BaseModel):
    id: str
    contract_id: str
    producer_id: str
    buyer_id: str
    energy_source: EnergySource
    energy_amount_kwh: float
    certificate_hash: Optional[str] = None
    issued_at: datetime
    expires_at: Optional[datetime] = None
    valid: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CertificateVerifyResponse(BaseModel):
    certificate_id: str
    valid: bool
    hash_match: bool
    expired: bool
    detail: str


class CertificateListResponse(BaseModel):
    total: int
    items: list[CertificateResponse]
