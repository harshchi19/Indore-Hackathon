"""
Verdant Backend – Dispute service (Part B)
Ticket lifecycle: create → add evidence → review → resolve.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.models.contracts import Contract
from app.models.disputes import AuditEntry, Dispute, DisputeStatus, EvidenceItem
from app.schemas.disputes import (
    DisputeAddEvidenceRequest,
    DisputeCreateRequest,
    DisputeListResponse,
    DisputeResolveRequest,
    DisputeResponse,
)

logger = get_logger("services.dispute")


def _dispute_to_response(d: Dispute) -> DisputeResponse:
    return DisputeResponse(
        id=str(d.id),
        contract_id=str(d.contract_id),
        raised_by=str(d.raised_by),
        status=d.status,
        description=d.description,
        resolution_note=d.resolution_note,
        evidence=d.evidence,
        audit_log=d.audit_log,
        created_at=d.created_at,
        updated_at=d.updated_at,
    )


async def create_dispute(payload: DisputeCreateRequest, user_id: str) -> DisputeResponse:
    """Create a new dispute ticket for a contract."""
    contract = await Contract.get(PydanticObjectId(payload.contract_id))
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    dispute = Dispute(
        contract_id=contract.id,
        raised_by=PydanticObjectId(user_id),
        description=payload.description,
        audit_log=[
            AuditEntry(
                actor=user_id,
                action="dispute_created",
            )
        ],
    )
    await dispute.insert()

    logger.info("Dispute created: %s for contract %s by user %s", str(dispute.id), payload.contract_id, user_id)
    return _dispute_to_response(dispute)


async def get_dispute(dispute_id: str) -> DisputeResponse:
    dispute = await Dispute.get(PydanticObjectId(dispute_id))
    if dispute is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")
    return _dispute_to_response(dispute)


async def list_disputes(
    contract_id: Optional[str] = None,
    raised_by: Optional[str] = None,
    status_filter: Optional[DisputeStatus] = None,
    skip: int = 0,
    limit: int = 50,
) -> DisputeListResponse:
    conditions: dict = {}
    if contract_id:
        conditions["contract_id"] = PydanticObjectId(contract_id)
    if raised_by:
        conditions["raised_by"] = PydanticObjectId(raised_by)
    if status_filter:
        conditions["status"] = status_filter.value

    total = await Dispute.find(conditions).count()
    items = await Dispute.find(conditions).sort("-created_at").skip(skip).limit(limit).to_list()
    return DisputeListResponse(
        total=total,
        items=[_dispute_to_response(d) for d in items],
    )


async def add_evidence(dispute_id: str, payload: DisputeAddEvidenceRequest, user_id: str) -> DisputeResponse:
    """Attach evidence to an open or under-review dispute."""
    dispute = await Dispute.get(PydanticObjectId(dispute_id))
    if dispute is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")

    if dispute.status == DisputeStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add evidence to a resolved dispute",
        )

    evidence = EvidenceItem(
        file_url=payload.file_url,
        description=payload.description,
    )
    dispute.evidence.append(evidence)
    dispute.audit_log.append(
        AuditEntry(actor=user_id, action="evidence_added")
    )

    # Auto-transition to reviewing if still open
    if dispute.status == DisputeStatus.OPEN:
        dispute.status = DisputeStatus.REVIEWING
        dispute.audit_log.append(
            AuditEntry(actor="system", action="status_changed_to_reviewing")
        )

    await dispute.save()
    logger.info("Evidence added to dispute %s by user %s", str(dispute.id), user_id)
    return _dispute_to_response(dispute)


async def resolve_dispute(dispute_id: str, payload: DisputeResolveRequest, admin_id: str) -> DisputeResponse:
    """Admin resolves a dispute with a resolution note."""
    dispute = await Dispute.get(PydanticObjectId(dispute_id))
    if dispute is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")

    if dispute.status == DisputeStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dispute is already resolved",
        )

    dispute.status = DisputeStatus.RESOLVED
    dispute.resolution_note = payload.resolution_note
    dispute.audit_log.append(
        AuditEntry(actor=admin_id, action=f"dispute_resolved: {payload.resolution_note[:100]}")
    )
    await dispute.save()

    logger.info("Dispute %s resolved by admin %s", str(dispute.id), admin_id)
    return _dispute_to_response(dispute)
