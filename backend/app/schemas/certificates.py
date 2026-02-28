from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CertificateCreate(BaseModel):
    """Schema for creating a certificate (internal use)."""
    
    contract_id: str = Field(..., description="Contract ID")
    producer_id: str = Field(..., description="Producer ID")
    energy_amount_kwh: float = Field(..., gt=0)
    certificate_type: str = Field(default="I-REC")
    energy_source: str = Field(default="solar")
    validity_days: int = Field(default=365, description="Certificate validity in days")


class CertificateResponse(BaseModel):
    """Schema for certificate response."""
    
    id: str = Field(..., alias="_id")
    contract_id: str
    producer_id: str
    energy_amount_kwh: float
    certificate_type: str
    certificate_hash: str
    certificate_number: str
    issued_at: datetime
    expires_at: datetime
    valid: bool
    invalidation_reason: Optional[str] = None
    energy_source: str
    co2_avoided_kg: float
    
    class Config:
        populate_by_name = True


class CertificateVerifyRequest(BaseModel):
    """Schema for verifying a certificate."""
    
    certificate_id: str = Field(..., description="Certificate ID to verify")
    certificate_hash: Optional[str] = Field(default=None, description="Expected hash for verification")


class CertificateVerifyResponse(BaseModel):
    """Schema for certificate verification response."""
    
    certificate_id: str
    is_valid: bool
    hash_matches: bool
    is_expired: bool
    certificate_number: str
    verification_timestamp: datetime
    message: str


class CertificateListResponse(BaseModel):
    """Schema for listing certificates."""
    
    certificates: List[CertificateResponse]
    total: int
    page: int
    page_size: int


class CertificateInvalidateRequest(BaseModel):
    """Schema for invalidating a certificate."""
    
    certificate_id: str
    reason: str = Field(..., description="Reason for invalidation")
