"""
Verdant Backend – Smart Meter schemas (Part B)
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.smart_meter import MeterReadingStatus


class MeterReadingIngestRequest(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=100)
    producer_id: str
    reading_kwh: float = Field(..., ge=0)
    timestamp: Optional[datetime] = None


class MeterReadingBatchIngestRequest(BaseModel):
    readings: List[MeterReadingIngestRequest] = Field(..., min_length=1, max_length=1000)


class MeterReadingResponse(BaseModel):
    id: str
    device_id: str
    producer_id: str
    reading_kwh: float
    previous_reading_kwh: Optional[float] = None
    status: MeterReadingStatus
    anomaly_reason: Optional[str] = None
    timestamp: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MeterReadingListResponse(BaseModel):
    total: int
    items: list[MeterReadingResponse]


class AnomalyReport(BaseModel):
    device_id: str
    total_readings: int
    anomalies: int
    anomaly_rate: float
    recent_anomalies: list[MeterReadingResponse]
