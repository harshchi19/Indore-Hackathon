from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from app.core.object_id import PyObjectId


class ContractDocument(BaseModel):
    """MongoDB Contract Document Model."""
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    buyer_id: PyObjectId
    producer_id: PyObjectId
    volume_kwh: float = Field(..., gt=0, description="Energy volume in kWh")
    price_per_kwh: float = Field(..., gt=0, description="Price per kWh in currency")
    contract_type: Literal["spot", "scheduled"] = Field(default="spot")
    status: Literal["pending", "active", "settled", "disputed"] = Field(default="pending")
    contract_hash: Optional[str] = Field(default=None, description="SHA-256 hash of contract")
    signature_buyer: bool = Field(default=False)
    signature_producer: bool = Field(default=False)
    settlement_date: Optional[datetime] = Field(default=None, description="T+1 settlement date")
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
    
    def get_hashable_content(self) -> dict:
        """Get content for hash computation."""
        return {
            "buyer_id": str(self.buyer_id),
            "producer_id": str(self.producer_id),
            "volume_kwh": self.volume_kwh,
            "price_per_kwh": self.price_per_kwh,
            "contract_type": self.contract_type,
            "created_at": self.created_at.isoformat()
        }
