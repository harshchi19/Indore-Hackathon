from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from app.core.object_id import PyObjectId


class SmartMeterReading(BaseModel):
    """MongoDB Smart Meter Reading Document Model."""
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    device_id: str = Field(..., description="Smart meter device identifier")
    producer_id: PyObjectId
    reading_kwh: float = Field(..., description="Energy reading in kWh")
    previous_reading_kwh: Optional[float] = Field(default=None, description="Previous reading for delta check")
    status: Literal["synced", "anomaly"] = Field(default="synced")
    anomaly_reason: Optional[str] = Field(default=None, description="Reason if anomaly detected")
    interval_seconds: Optional[int] = Field(default=None, description="Time since last reading")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    processed: bool = Field(default=False, description="Whether processed by worker")
    
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


class SmartMeterDevice(BaseModel):
    """Smart Meter Device Registration Model."""
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    device_id: str = Field(..., description="Unique device identifier")
    producer_id: PyObjectId
    device_type: str = Field(default="electricity", description="Type of meter")
    location: Optional[str] = Field(default=None)
    last_reading_kwh: Optional[float] = Field(default=None)
    last_reading_at: Optional[datetime] = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
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
