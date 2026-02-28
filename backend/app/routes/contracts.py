from fastapi import APIRouter, Query, status
from typing import Optional

from app.schemas.contracts import (
    ContractCreate,
    ContractResponse,
    ContractSign,
    ContractListResponse,
    ContractSettlementRequest,
    ContractSettlementResponse
)
from app.services.contract_service import ContractService

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.post(
    "/",
    response_model=ContractResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new contract"
)
async def create_contract(data: ContractCreate):
    """
    Create a new energy trading contract.
    
    - Generates a unique contract hash (SHA-256)
    - Sets T+1 settlement date
    - Status starts as 'pending'
    """
    return await ContractService.create_contract(data)


@router.get(
    "/{contract_id}",
    response_model=ContractResponse,
    summary="Get contract by ID"
)
async def get_contract(contract_id: str):
    """Get contract details by ID."""
    return await ContractService.get_contract(contract_id)


@router.get(
    "/",
    response_model=ContractListResponse,
    summary="List contracts"
)
async def list_contracts(
    buyer_id: Optional[str] = Query(None, description="Filter by buyer ID"),
    producer_id: Optional[str] = Query(None, description="Filter by producer ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List contracts with optional filters."""
    return await ContractService.list_contracts(
        buyer_id=buyer_id,
        producer_id=producer_id,
        status_filter=status,
        page=page,
        page_size=page_size
    )


@router.post(
    "/{contract_id}/sign",
    response_model=ContractResponse,
    summary="Sign a contract"
)
async def sign_contract(contract_id: str, data: ContractSign):
    """
    Sign a contract as buyer or producer.
    
    - When both parties sign, contract status changes to 'active'
    """
    return await ContractService.sign_contract(contract_id, data)


@router.patch(
    "/{contract_id}/status",
    response_model=ContractResponse,
    summary="Update contract status"
)
async def update_contract_status(
    contract_id: str,
    new_status: str = Query(..., description="New status: pending, active, settled, disputed")
):
    """Update contract status."""
    return await ContractService.update_status(contract_id, new_status)


@router.post(
    "/{contract_id}/settle",
    response_model=ContractSettlementResponse,
    summary="Settle a contract"
)
async def settle_contract(
    contract_id: str,
    force: bool = Query(False, description="Force settlement before T+1")
):
    """
    Settle an active contract (T+1 simulation).
    
    - Contract must be in 'active' status
    - By default, settlement is allowed only after T+1 date
    - Use force=true to bypass T+1 restriction
    - Triggers certificate issuance
    """
    return await ContractService.settle_contract(contract_id, force)


@router.get(
    "/{contract_id}/hash",
    summary="Get contract hash"
)
async def get_contract_hash(contract_id: str):
    """Get the SHA-256 hash of a contract for verification."""
    contract = await ContractService.get_contract(contract_id)
    return {
        "contract_id": contract_id,
        "contract_hash": contract.contract_hash,
        "message": "Use this hash to verify contract integrity"
    }
