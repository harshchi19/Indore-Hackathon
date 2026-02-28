"""
Verdant Backend – Smart Meter reading document model (Part B)
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import PydanticObjectId
from pydantic import Field

from app.db.base import TimestampedDocument


class MeterReadingStatus(str, Enum):
    SYNCED = "synced"
    ANOMALY = "anomaly"


class SmartMeterReading(TimestampedDocument):
    """MongoDB document for smart meter readings."""

    device_id: str = Field(..., min_length=1, max_length=100)
    producer_id: PydanticObjectId
    reading_kwh: float = Field(..., ge=0)
    previous_reading_kwh: Optional[float] = None
    status: MeterReadingStatus = MeterReadingStatus.SYNCED
    anomaly_reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "smart_meter_readings"
        use_state_management = True
        indexes = [
            "device_id",
            "producer_id",
            "timestamp",
            "status",
        ]
