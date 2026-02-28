"""
Verdant Backend – Dispute schemas (Part B)
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.disputes import AuditEntry, DisputeStatus, EvidenceItem


class DisputeCreateRequest(BaseModel):
    contract_id: str
    description: str = Field(..., min_length=10, max_length=5000)


class DisputeAddEvidenceRequest(BaseModel):
    file_url: str
    description: Optional[str] = None


class DisputeResolveRequest(BaseModel):
    resolution_note: str = Field(..., min_length=5, max_length=5000)


class DisputeResponse(BaseModel):
    id: str
    contract_id: str
    raised_by: str
    status: DisputeStatus
    description: str
    resolution_note: Optional[str] = None
    evidence: List[EvidenceItem]
    audit_log: List[AuditEntry]
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DisputeListResponse(BaseModel):
    total: int
    items: list[DisputeResponse]
