"""
Verdant Backend – Smart Meter routes (Part B)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import _get_current_user
from app.models.smart_meter import MeterReadingStatus
from app.models.users import User
from app.schemas.smart_meter import (
    AnomalyReport,
    MeterReadingBatchIngestRequest,
    MeterReadingIngestRequest,
    MeterReadingListResponse,
    MeterReadingResponse,
)
from app.services import smart_meter_service

router = APIRouter(prefix="/meters", tags=["Smart Meters"])


@router.post(
    "/readings",
    response_model=MeterReadingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a single smart meter reading",
)
async def ingest_reading(
    payload: MeterReadingIngestRequest,
    current_user: User = Depends(_get_current_user),
) -> MeterReadingResponse:
    return await smart_meter_service.ingest_reading(payload)


@router.post(
    "/readings/batch",
    response_model=list[MeterReadingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a batch of smart meter readings",
)
async def ingest_batch(
    payload: MeterReadingBatchIngestRequest,
    current_user: User = Depends(_get_current_user),
) -> list[MeterReadingResponse]:
    return await smart_meter_service.ingest_batch(payload.readings)


@router.get(
    "/readings",
    response_model=MeterReadingListResponse,
    summary="List meter readings",
)
async def list_readings(
    device_id: Optional[str] = Query(default=None),
    producer_id: Optional[str] = Query(default=None),
    status_filter: Optional[MeterReadingStatus] = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    current_user: User = Depends(_get_current_user),
) -> MeterReadingListResponse:
    return await smart_meter_service.list_readings(device_id, producer_id, status_filter, skip, limit)


@router.get(
    "/anomalies/{device_id}",
    response_model=AnomalyReport,
    summary="Get anomaly report for a device",
)
async def anomaly_report(
    device_id: str,
    current_user: User = Depends(_get_current_user),
) -> AnomalyReport:
    return await smart_meter_service.get_anomaly_report(device_id)
