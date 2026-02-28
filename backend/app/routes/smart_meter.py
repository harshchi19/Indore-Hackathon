from fastapi import APIRouter, Query, status
from typing import Optional

from app.schemas.smart_meter import (
    SmartMeterReadingCreate,
    SmartMeterReadingResponse,
    SmartMeterDeviceCreate,
    SmartMeterDeviceResponse,
    SmartMeterAnomalyReport,
    SmartMeterReadingListResponse
)
from app.services.smart_meter_service import SmartMeterService

router = APIRouter(prefix="/smart-meters", tags=["Smart Meters"])


@router.post(
    "/devices",
    response_model=SmartMeterDeviceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a smart meter device"
)
async def register_device(data: SmartMeterDeviceCreate):
    """
    Register a new smart meter device.
    
    - Device ID must be unique
    - Links device to producer
    """
    return await SmartMeterService.register_device(data)


@router.get(
    "/devices/{device_id}",
    response_model=SmartMeterDeviceResponse,
    summary="Get device by device ID"
)
async def get_device(device_id: str):
    """Get smart meter device details."""
    return await SmartMeterService.get_device(device_id)


@router.post(
    "/readings",
    response_model=SmartMeterReadingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a meter reading"
)
async def submit_reading(data: SmartMeterReadingCreate):
    """
    Submit a smart meter reading.
    
    Anti-fraud checks performed:
    - Negative readings
    - Large reading jumps (>500% increase)
    - Interval too short (<60 seconds)
    - Interval gap (>24 hours)
    
    Anomalies are flagged but still stored.
    """
    return await SmartMeterService.submit_reading(data)


@router.get(
    "/readings/{reading_id}",
    response_model=SmartMeterReadingResponse,
    summary="Get reading by ID"
)
async def get_reading(reading_id: str):
    """Get a specific meter reading."""
    return await SmartMeterService.get_reading(reading_id)


@router.get(
    "/readings",
    response_model=SmartMeterReadingListResponse,
    summary="List meter readings"
)
async def list_readings(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    producer_id: Optional[str] = Query(None, description="Filter by producer ID"),
    status: Optional[str] = Query(None, description="Filter by status: synced, anomaly"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200)
):
    """List meter readings with optional filters."""
    return await SmartMeterService.list_readings(
        device_id=device_id,
        producer_id=producer_id,
        status_filter=status,
        page=page,
        page_size=page_size
    )


@router.get(
    "/anomalies",
    response_model=SmartMeterAnomalyReport,
    summary="Get anomaly report"
)
async def get_anomaly_report(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    producer_id: Optional[str] = Query(None, description="Filter by producer ID")
):
    """
    Get anomaly report for devices/producers.
    
    Returns:
    - Total readings count
    - Anomaly count and rate
    - List of recent anomalies
    """
    return await SmartMeterService.get_anomaly_report(
        device_id=device_id,
        producer_id=producer_id
    )


@router.get(
    "/devices/{device_id}/readings",
    response_model=SmartMeterReadingListResponse,
    summary="Get readings for a specific device"
)
async def get_device_readings(
    device_id: str,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200)
):
    """Get all readings for a specific device."""
    return await SmartMeterService.list_readings(
        device_id=device_id,
        status_filter=status,
        page=page,
        page_size=page_size
    )
