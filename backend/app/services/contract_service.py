from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status

from app.models.contracts import ContractDocument
from app.schemas.contracts import (
    ContractCreate,
    ContractUpdate,
    ContractSign,
    ContractResponse,
    ContractSettlementResponse
)
from app.core.hashing import compute_sha256_hash
from app.core.config import settings


# In-memory store for testing without MongoDB
_contracts_store: Dict[str, dict] = {}


class ContractService:
    """Service for contract operations."""
    
    @staticmethod
    def _generate_id() -> str:
        return str(ObjectId())
    
    @staticmethod
    async def create_contract(data: ContractCreate) -> ContractResponse:
        """Create a new contract."""
        contract_id = ContractService._generate_id()
        now = datetime.utcnow()
        
        contract = ContractDocument(
            id=ObjectId(contract_id),
            buyer_id=ObjectId(data.buyer_id),
            producer_id=ObjectId(data.producer_id),
            volume_kwh=data.volume_kwh,
            price_per_kwh=data.price_per_kwh,
            contract_type=data.contract_type,
            status="pending",
            signature_buyer=False,
            signature_producer=False,
            created_at=now,
            updated_at=now
        )
        
        # Generate contract hash
        contract_hash = compute_sha256_hash(contract.get_hashable_content())
        contract.contract_hash = contract_hash
        
        # Calculate T+1 settlement date
        contract.settlement_date = now + timedelta(days=1)
        
        # Store in memory
        contract_data = contract.to_mongo()
        contract_data["_id"] = contract_id
        _contracts_store[contract_id] = contract_data
        
        return ContractService._to_response(contract_data)
    
    @staticmethod
    async def get_contract(contract_id: str) -> Optional[ContractResponse]:
        """Get a contract by ID."""
        contract = _contracts_store.get(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contract {contract_id} not found"
            )
        return ContractService._to_response(contract)
    
    @staticmethod
    async def list_contracts(
        buyer_id: Optional[str] = None,
        producer_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """List contracts with filters."""
        contracts = list(_contracts_store.values())
        
        # Apply filters
        if buyer_id:
            contracts = [c for c in contracts if str(c.get("buyer_id")) == buyer_id]
        if producer_id:
            contracts = [c for c in contracts if str(c.get("producer_id")) == producer_id]
        if status_filter:
            contracts = [c for c in contracts if c.get("status") == status_filter]
        
        total = len(contracts)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = contracts[start:end]
        
        return {
            "contracts": [ContractService._to_response(c) for c in paginated],
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    @staticmethod
    async def sign_contract(contract_id: str, sign_data: ContractSign) -> ContractResponse:
        """Sign a contract (buyer or producer)."""
        contract = _contracts_store.get(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contract {contract_id} not found"
            )
        
        # Verify signer authorization
        if sign_data.signer_type == "buyer":
            if str(contract["buyer_id"]) != sign_data.signer_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Signer is not the buyer of this contract"
                )
            contract["signature_buyer"] = True
        elif sign_data.signer_type == "producer":
            if str(contract["producer_id"]) != sign_data.signer_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Signer is not the producer of this contract"
                )
            contract["signature_producer"] = True
        
        contract["updated_at"] = datetime.utcnow()
        
        # If both signed, activate contract
        if contract["signature_buyer"] and contract["signature_producer"]:
            contract["status"] = "active"
        
        _contracts_store[contract_id] = contract
        return ContractService._to_response(contract)
    
    @staticmethod
    async def update_status(contract_id: str, new_status: str) -> ContractResponse:
        """Update contract status."""
        contract = _contracts_store.get(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contract {contract_id} not found"
            )
        
        valid_statuses = ["pending", "active", "settled", "disputed"]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {valid_statuses}"
            )
        
        contract["status"] = new_status
        contract["updated_at"] = datetime.utcnow()
        _contracts_store[contract_id] = contract
        
        return ContractService._to_response(contract)
    
    @staticmethod
    async def settle_contract(contract_id: str, force: bool = False) -> ContractSettlementResponse:
        """Settle a contract (T+1 simulation)."""
        contract = _contracts_store.get(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contract {contract_id} not found"
            )
        
        if contract["status"] != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contract must be active to settle"
            )
        
        # Check T+1 settlement date
        settlement_date = contract.get("settlement_date")
        if settlement_date and not force:
            if isinstance(settlement_date, str):
                settlement_date = datetime.fromisoformat(settlement_date)
            if datetime.utcnow() < settlement_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Settlement not allowed until {settlement_date.isoformat()}"
                )
        
        # Update status to settled
        contract["status"] = "settled"
        contract["updated_at"] = datetime.utcnow()
        _contracts_store[contract_id] = contract
        
        return ContractSettlementResponse(
            contract_id=contract_id,
            status="settled",
            settlement_date=datetime.utcnow(),
            certificate_id=None,  # Will be set by certificate worker
            payment_id=None,  # Will be set by payment service
            message="Contract settled successfully. Certificate issuance triggered."
        )
    
    @staticmethod
    def _to_response(contract: dict) -> ContractResponse:
        """Convert contract dict to response schema."""
        return ContractResponse(
            _id=str(contract["_id"]),
            buyer_id=str(contract["buyer_id"]),
            producer_id=str(contract["producer_id"]),
            volume_kwh=contract["volume_kwh"],
            price_per_kwh=contract["price_per_kwh"],
            total_amount=contract["volume_kwh"] * contract["price_per_kwh"],
            contract_type=contract["contract_type"],
            status=contract["status"],
            contract_hash=contract.get("contract_hash"),
            signature_buyer=contract.get("signature_buyer", False),
            signature_producer=contract.get("signature_producer", False),
            settlement_date=contract.get("settlement_date"),
            created_at=contract["created_at"],
            updated_at=contract["updated_at"]
        )


# Export singleton-like functions
contract_service = ContractService()
