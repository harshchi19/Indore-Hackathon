"""
Verdant Backend – Dispute routes (Part B)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import _get_current_user, require_roles
from app.models.disputes import DisputeStatus
from app.models.users import User
from app.schemas.disputes import (
    DisputeAddEvidenceRequest,
    DisputeCreateRequest,
    DisputeListResponse,
    DisputeResolveRequest,
    DisputeResponse,
)
from app.services import dispute_service

router = APIRouter(prefix="/disputes", tags=["Disputes"])


@router.post(
    "",
    response_model=DisputeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a dispute ticket",
)
async def create_dispute(
    payload: DisputeCreateRequest,
    current_user: User = Depends(_get_current_user),
) -> DisputeResponse:
    return await dispute_service.create_dispute(payload, user_id=str(current_user.id))


@router.get(
    "",
    response_model=DisputeListResponse,
    summary="List disputes",
)
async def list_disputes(
    contract_id: Optional[str] = Query(default=None),
    raised_by: Optional[str] = Query(default=None),
    status_filter: Optional[DisputeStatus] = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(_get_current_user),
) -> DisputeListResponse:
    return await dispute_service.list_disputes(contract_id, raised_by, status_filter, skip, limit)


@router.get(
    "/{dispute_id}",
    response_model=DisputeResponse,
    summary="Get dispute details",
)
async def get_dispute(
    dispute_id: str,
    current_user: User = Depends(_get_current_user),
) -> DisputeResponse:
    return await dispute_service.get_dispute(dispute_id)


@router.post(
    "/{dispute_id}/evidence",
    response_model=DisputeResponse,
    summary="Add evidence to a dispute",
)
async def add_evidence(
    dispute_id: str,
    payload: DisputeAddEvidenceRequest,
    current_user: User = Depends(_get_current_user),
) -> DisputeResponse:
    return await dispute_service.add_evidence(dispute_id, payload, user_id=str(current_user.id))


@router.post(
    "/{dispute_id}/resolve",
    response_model=DisputeResponse,
    summary="Resolve a dispute (admin only)",
    dependencies=[Depends(require_roles(["admin"]))],
)
async def resolve_dispute(
    dispute_id: str,
    payload: DisputeResolveRequest,
    current_user: User = Depends(_get_current_user),
) -> DisputeResponse:
    return await dispute_service.resolve_dispute(dispute_id, payload, admin_id=str(current_user.id))
