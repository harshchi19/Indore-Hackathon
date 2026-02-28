from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from app.core.object_id import PyObjectId


class EvidenceItem(BaseModel):
    """Evidence item embedded in dispute document."""
    
    id: str = Field(..., description="Evidence item ID")
    file_url: str = Field(..., description="URL to evidence file")
    file_type: str = Field(default="document", description="Type of evidence: document, image, video")
    description: Optional[str] = Field(default=None)
    uploaded_by: PyObjectId
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLogEntry(BaseModel):
    """Audit log entry embedded in dispute document."""
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor: PyObjectId
    actor_role: str = Field(default="user")
    action: str = Field(..., description="Action performed")
    details: Optional[str] = Field(default=None)
    previous_status: Optional[str] = Field(default=None)
    new_status: Optional[str] = Field(default=None)


class DisputeDocument(BaseModel):
    """MongoDB Dispute Document Model."""
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    contract_id: PyObjectId
    raised_by: PyObjectId
    raised_against: PyObjectId
    status: Literal["open", "reviewing", "resolved", "rejected", "escalated"] = Field(default="open")
    dispute_type: str = Field(default="general", description="Type: quality, delivery, payment, fraud")
    priority: Literal["low", "medium", "high", "critical"] = Field(default="medium")
    description: str = Field(..., description="Dispute description")
    resolution: Optional[str] = Field(default=None, description="Resolution details")
    resolved_by: Optional[PyObjectId] = Field(default=None)
    resolved_at: Optional[datetime] = Field(default=None)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    audit_log: List[AuditLogEntry] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str}
    
    def to_mongo(self) -> dict:
        """Convert to MongoDB document format."""
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and data["_id"] is None:
            del data["_id"]
        return data
    
    def add_audit_entry(
        self,
        actor: PyObjectId,
        action: str,
        actor_role: str = "user",
        details: Optional[str] = None,
        previous_status: Optional[str] = None,
        new_status: Optional[str] = None
    ):
        """Add an audit log entry."""
        entry = AuditLogEntry(
            actor=actor,
            actor_role=actor_role,
            action=action,
            details=details,
            previous_status=previous_status,
            new_status=new_status
        )
        self.audit_log.append(entry)
        self.updated_at = datetime.utcnow()
