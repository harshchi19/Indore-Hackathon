from fastapi import APIRouter, Query, status
from typing import Optional

from app.schemas.disputes import (
    DisputeCreate,
    EvidenceAdd,
    DisputeResponse,
    DisputeStatusUpdate,
    DisputeResolve,
    DisputeListResponse
)
from app.services.dispute_service import DisputeService

router = APIRouter(prefix="/disputes", tags=["Disputes"])


@router.post(
    "/",
    response_model=DisputeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a dispute ticket"
)
async def create_dispute(data: DisputeCreate):
    """
    Create a new dispute ticket.
    
    - Initial status is 'open'
    - Audit log is initiated
    """
    return await DisputeService.create_dispute(data)


@router.get(
    "/{dispute_id}",
    response_model=DisputeResponse,
    summary="Get dispute by ID"
)
async def get_dispute(dispute_id: str):
    """Get dispute details including evidence and audit log."""
    return await DisputeService.get_dispute(dispute_id)


@router.get(
    "/",
    response_model=DisputeListResponse,
    summary="List disputes"
)
async def list_disputes(
    raised_by: Optional[str] = Query(None, description="Filter by user who raised"),
    raised_against: Optional[str] = Query(None, description="Filter by disputed party"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List disputes with optional filters."""
    return await DisputeService.list_disputes(
        raised_by=raised_by,
        raised_against=raised_against,
        status_filter=status,
        priority=priority,
        page=page,
        page_size=page_size
    )


@router.post(
    "/evidence",
    response_model=DisputeResponse,
    summary="Add evidence to a dispute"
)
async def add_evidence(data: EvidenceAdd):
    """
    Add evidence to an existing dispute.
    
    - Cannot add evidence to resolved disputes
    - Creates audit log entry
    """
    return await DisputeService.add_evidence(data)


@router.patch(
    "/status",
    response_model=DisputeResponse,
    summary="Update dispute status"
)
async def update_status(data: DisputeStatusUpdate):
    """
    Update dispute status with workflow validation.
    
    Valid transitions:
    - open → reviewing, resolved, rejected
    - reviewing → open, resolved, rejected, escalated
    - escalated → reviewing, resolved, rejected
    """
    return await DisputeService.update_status(data)


@router.post(
    "/resolve",
    response_model=DisputeResponse,
    summary="Resolve a dispute (Admin)"
)
async def resolve_dispute(data: DisputeResolve):
    """
    Resolve a dispute with admin decision.
    
    Outcomes:
    - in_favor_buyer
    - in_favor_producer
    - partial
    - dismissed
    """
    return await DisputeService.resolve_dispute(data)


@router.get(
    "/{dispute_id}/audit-log",
    summary="Get dispute audit log"
)
async def get_audit_log(dispute_id: str):
    """Get full audit log for a dispute."""
    dispute = await DisputeService.get_dispute(dispute_id)
    return {
        "dispute_id": dispute_id,
        "audit_log": dispute.audit_log
    }


@router.get(
    "/{dispute_id}/evidence",
    summary="Get dispute evidence"
)
async def get_evidence(dispute_id: str):
    """Get all evidence items for a dispute."""
    dispute = await DisputeService.get_dispute(dispute_id)
    return {
        "dispute_id": dispute_id,
        "evidence_count": len(dispute.evidence),
        "evidence": dispute.evidence
    }
