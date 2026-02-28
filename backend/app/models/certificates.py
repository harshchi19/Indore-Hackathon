from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.core.object_id import PyObjectId


class CertificateDocument(BaseModel):
    """MongoDB Certificate Document Model (I-REC / G-GO compatible)."""
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    contract_id: PyObjectId
    producer_id: PyObjectId
    energy_amount_kwh: float = Field(..., gt=0, description="Energy amount certified")
    certificate_type: str = Field(default="I-REC", description="Certificate type: I-REC, G-GO, etc.")
    certificate_hash: str = Field(..., description="SHA-256 hash of certificate content")
    certificate_number: str = Field(..., description="Unique certificate identifier")
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(..., description="Certificate expiration date")
    valid: bool = Field(default=True, description="Whether certificate is valid")
    invalidation_reason: Optional[str] = Field(default=None)
    energy_source: str = Field(default="solar", description="Energy source type")
    co2_avoided_kg: float = Field(default=0, description="CO2 avoided in kg")
    metadata: Optional[dict] = Field(default=None, description="Additional certificate metadata")
    
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
    
    def get_hashable_content(self) -> dict:
        """Get content for hash computation."""
        return {
            "contract_id": str(self.contract_id),
            "producer_id": str(self.producer_id),
            "energy_amount_kwh": self.energy_amount_kwh,
            "certificate_type": self.certificate_type,
            "certificate_number": self.certificate_number,
            "issued_at": self.issued_at.isoformat(),
            "energy_source": self.energy_source
        }
    
    def is_expired(self) -> bool:
        """Check if certificate is expired."""
        return datetime.utcnow() > self.expires_at
