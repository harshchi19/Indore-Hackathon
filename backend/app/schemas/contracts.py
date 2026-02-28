from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field


class ContractCreate(BaseModel):
    """Schema for creating a new contract."""
    
    buyer_id: str = Field(..., description="Buyer user ID")
    producer_id: str = Field(..., description="Producer ID")
    volume_kwh: float = Field(..., gt=0, description="Energy volume in kWh")
    price_per_kwh: float = Field(..., gt=0, description="Price per kWh")
    contract_type: Literal["spot", "scheduled"] = Field(default="spot")


class ContractUpdate(BaseModel):
    """Schema for updating a contract."""
    
    status: Optional[Literal["pending", "active", "settled", "disputed"]] = None
    signature_buyer: Optional[bool] = None
    signature_producer: Optional[bool] = None


class ContractSign(BaseModel):
    """Schema for signing a contract."""
    
    signer_id: str = Field(..., description="ID of the signer (buyer or producer)")
    signer_type: Literal["buyer", "producer"] = Field(..., description="Type of signer")


class ContractResponse(BaseModel):
    """Schema for contract response."""
    
    id: str = Field(..., alias="_id")
    buyer_id: str
    producer_id: str
    volume_kwh: float
    price_per_kwh: float
    total_amount: float
    contract_type: str
    status: str
    contract_hash: Optional[str] = None
    signature_buyer: bool
    signature_producer: bool
    settlement_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True


class ContractListResponse(BaseModel):
    """Schema for listing contracts."""
    
    contracts: List[ContractResponse]
    total: int
    page: int
    page_size: int


class ContractSettlementRequest(BaseModel):
    """Schema for triggering contract settlement."""
    
    contract_id: str = Field(..., description="Contract ID to settle")
    force: bool = Field(default=False, description="Force settlement even if not T+1")


class ContractSettlementResponse(BaseModel):
    """Schema for settlement response."""
    
    contract_id: str
    status: str
    settlement_date: datetime
    certificate_id: Optional[str] = None
    payment_id: Optional[str] = None
    message: str
