from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class DisputeCreate(BaseModel):
    """Schema for creating a dispute."""
    
    contract_id: str = Field(..., description="Contract ID")
    raised_by: str = Field(..., description="User ID raising dispute")
    raised_against: str = Field(..., description="User/Producer ID disputed against")
    dispute_type: str = Field(default="general", description="Type: quality, delivery, payment, fraud")
    priority: Literal["low", "medium", "high", "critical"] = Field(default="medium")
    description: str = Field(..., min_length=10, description="Dispute description")


class EvidenceAdd(BaseModel):
    """Schema for adding evidence to a dispute."""
    
    dispute_id: str = Field(..., description="Dispute ID")
    file_url: str = Field(..., description="URL to evidence file")
    file_type: str = Field(default="document", description="Type: document, image, video")
    description: Optional[str] = None
    uploaded_by: str = Field(..., description="User ID uploading evidence")


class EvidenceResponse(BaseModel):
    """Schema for evidence response."""
    
    id: str
    file_url: str
    file_type: str
    description: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime


class AuditLogResponse(BaseModel):
    """Schema for audit log entry response."""
    
    timestamp: datetime
    actor: str
    actor_role: str
    action: str
    details: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: Optional[str] = None


class DisputeResponse(BaseModel):
    """Schema for dispute response."""
    
    id: str = Field(..., alias="_id")
    contract_id: str
    raised_by: str
    raised_against: str
    status: str
    dispute_type: str
    priority: str
    description: str
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    evidence: List[EvidenceResponse]
    audit_log: List[AuditLogResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True


class DisputeStatusUpdate(BaseModel):
    """Schema for updating dispute status."""
    
    dispute_id: str = Field(..., description="Dispute ID")
    new_status: Literal["open", "reviewing", "resolved", "rejected", "escalated"]
    actor_id: str = Field(..., description="User ID performing action")
    actor_role: str = Field(default="admin")
    details: Optional[str] = None


class DisputeResolve(BaseModel):
    """Schema for resolving a dispute."""
    
    dispute_id: str = Field(..., description="Dispute ID")
    resolution: str = Field(..., min_length=10, description="Resolution details")
    resolved_by: str = Field(..., description="Admin user ID resolving")
    outcome: Literal["in_favor_buyer", "in_favor_producer", "partial", "dismissed"]


class DisputeListResponse(BaseModel):
    """Schema for listing disputes."""
    
    disputes: List[DisputeResponse]
    total: int
    page: int
    page_size: int
