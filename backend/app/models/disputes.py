"""
Verdant Backend – Dispute document model (Part B)
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from app.db.base import TimestampedDocument


class DisputeStatus(str, Enum):
    OPEN = "open"
    REVIEWING = "reviewing"
    RESOLVED = "resolved"


class EvidenceItem(BaseModel):
    """Embedded sub-document for evidence attachments."""

    file_url: str
    description: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditEntry(BaseModel):
    """Embedded sub-document for audit trail."""

    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    actor: str  # user id or "system"
    action: str


class Dispute(TimestampedDocument):
    """MongoDB document for dispute tickets."""

    contract_id: PydanticObjectId
    raised_by: PydanticObjectId  # user id
    status: DisputeStatus = DisputeStatus.OPEN
    description: str = Field(..., min_length=10, max_length=5000)
    resolution_note: Optional[str] = None
    evidence: List[EvidenceItem] = Field(default_factory=list)
    audit_log: List[AuditEntry] = Field(default_factory=list)

    class Settings:
        name = "disputes"
        use_state_management = True
        indexes = [
            "contract_id",
            "raised_by",
            "status",
        ]
