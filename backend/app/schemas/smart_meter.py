from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field


class SmartMeterReadingCreate(BaseModel):
    """Schema for submitting a smart meter reading."""
    
    device_id: str = Field(..., description="Smart meter device ID")
    producer_id: str = Field(..., description="Producer ID")
    reading_kwh: float = Field(..., description="Energy reading in kWh")
    timestamp: Optional[datetime] = Field(default=None, description="Reading timestamp")


class SmartMeterReadingBatch(BaseModel):
    """Schema for batch meter readings submission."""
    
    device_id: str
    producer_id: str
    readings: List[dict] = Field(..., description="List of {reading_kwh, timestamp} objects")


class SmartMeterReadingResponse(BaseModel):
    """Schema for meter reading response."""
    
    id: str = Field(..., alias="_id")
    device_id: str
    producer_id: str
    reading_kwh: float
    previous_reading_kwh: Optional[float] = None
    status: str
    anomaly_reason: Optional[str] = None
    timestamp: datetime
    processed: bool
    
    class Config:
        populate_by_name = True


class SmartMeterDeviceCreate(BaseModel):
    """Schema for registering a smart meter device."""
    
    device_id: str = Field(..., description="Unique device identifier")
    producer_id: str = Field(..., description="Producer ID")
    device_type: str = Field(default="electricity")
    location: Optional[str] = None


class SmartMeterDeviceResponse(BaseModel):
    """Schema for smart meter device response."""
    
    id: str = Field(..., alias="_id")
    device_id: str
    producer_id: str
    device_type: str
    location: Optional[str] = None
    last_reading_kwh: Optional[float] = None
    last_reading_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        populate_by_name = True


class SmartMeterAnomalyReport(BaseModel):
    """Schema for anomaly report."""
    
    device_id: str
    producer_id: str
    total_readings: int
    anomaly_count: int
    anomaly_rate: float
    anomalies: List[SmartMeterReadingResponse]


class SmartMeterReadingListResponse(BaseModel):
    """Schema for listing meter readings."""
    
    readings: List[SmartMeterReadingResponse]
    total: int
    page: int
    page_size: int
