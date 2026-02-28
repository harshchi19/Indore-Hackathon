"""
Verdant Backend – Contract routes (Part B)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import _get_current_user
from app.models.contracts import ContractStatus
from app.models.users import User
from app.schemas.contracts import (
    ContractCreateRequest,
    ContractListResponse,
    ContractResponse,
    ContractSignRequest,
)
from app.services import contract_service

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.post(
    "",
    response_model=ContractResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new energy trade contract",
)
async def create_contract(
    payload: ContractCreateRequest,
    current_user: User = Depends(_get_current_user),
) -> ContractResponse:
    return await contract_service.create_contract(payload)


@router.get(
    "",
    response_model=ContractListResponse,
    summary="List contracts",
)
async def list_contracts(
    buyer_id: Optional[str] = Query(default=None),
    producer_id: Optional[str] = Query(default=None),
    status_filter: Optional[ContractStatus] = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(_get_current_user),
) -> ContractListResponse:
    return await contract_service.list_contracts(buyer_id, producer_id, status_filter, skip, limit)


@router.get(
    "/{contract_id}",
    response_model=ContractResponse,
    summary="Get contract details",
)
async def get_contract(
    contract_id: str,
    current_user: User = Depends(_get_current_user),
) -> ContractResponse:
    return await contract_service.get_contract(contract_id)


@router.post(
    "/{contract_id}/sign",
    response_model=ContractResponse,
    summary="Sign a contract (buyer or producer)",
)
async def sign_contract(
    contract_id: str,
    payload: ContractSignRequest,
    current_user: User = Depends(_get_current_user),
) -> ContractResponse:
    return await contract_service.sign_contract(contract_id, payload)


@router.post(
    "/{contract_id}/settle",
    response_model=ContractResponse,
    summary="Settle a contract (T+1 mock)",
)
async def settle_contract(
    contract_id: str,
    current_user: User = Depends(_get_current_user),
) -> ContractResponse:
    return await contract_service.settle_contract(contract_id)


@router.post(
    "/{contract_id}/dispute",
    response_model=ContractResponse,
    summary="Mark contract as disputed",
)
async def dispute_contract(
    contract_id: str,
    current_user: User = Depends(_get_current_user),
) -> ContractResponse:
    return await contract_service.dispute_contract(contract_id)
