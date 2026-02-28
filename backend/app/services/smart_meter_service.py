"""
Verdant Backend – Smart Meter service (Part B)
Reading ingestion, anti-fraud anomaly detection, and reporting.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.models.smart_meter import MeterReadingStatus, SmartMeterReading
from app.schemas.smart_meter import (
    AnomalyReport,
    MeterReadingIngestRequest,
    MeterReadingListResponse,
    MeterReadingResponse,
)

logger = get_logger("services.smart_meter")

# ── Anti-fraud thresholds ───────────────────────────────────
MAX_JUMP_KWH = 10_000.0          # max allowed jump between consecutive readings
MIN_INTERVAL_SECONDS = 30        # readings closer than this are suspicious
MAX_READING_KWH = 1_000_000.0    # sanity cap


def _reading_to_response(r: SmartMeterReading) -> MeterReadingResponse:
    return MeterReadingResponse(
        id=str(r.id),
        device_id=r.device_id,
        producer_id=str(r.producer_id),
        reading_kwh=r.reading_kwh,
        previous_reading_kwh=r.previous_reading_kwh,
        status=r.status,
        anomaly_reason=r.anomaly_reason,
        timestamp=r.timestamp,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


def _detect_anomalies(
    reading_kwh: float,
    previous: Optional[SmartMeterReading],
    timestamp: datetime,
) -> Optional[str]:
    """
    Run anti-fraud checks against the incoming reading.
    Returns an anomaly reason string or None.
    """
    reasons: list[str] = []

    # 1. Negative reading
    if reading_kwh < 0:
        reasons.append("negative reading")

    # 2. Exceeds sanity cap
    if reading_kwh > MAX_READING_KWH:
        reasons.append(f"reading exceeds max cap ({MAX_READING_KWH} kWh)")

    if previous is not None:
        # 3. Negative jump (meter rollback)
        delta = reading_kwh - previous.reading_kwh
        if delta < 0:
            reasons.append(f"meter rollback (delta={delta:.2f} kWh)")

        # 4. Sudden large jump
        if delta > MAX_JUMP_KWH:
            reasons.append(f"sudden jump ({delta:.2f} kWh > {MAX_JUMP_KWH} max)")

        # 5. Unexpected interval (too close)
        if previous.timestamp:
            interval = (timestamp - previous.timestamp).total_seconds()
            if 0 < interval < MIN_INTERVAL_SECONDS:
                reasons.append(f"interval too short ({interval:.0f}s < {MIN_INTERVAL_SECONDS}s)")

    return "; ".join(reasons) if reasons else None


async def ingest_reading(payload: MeterReadingIngestRequest) -> MeterReadingResponse:
    """Ingest a single smart meter reading with anomaly detection."""
    ts = payload.timestamp or datetime.now(timezone.utc)

    # Fetch previous reading for this device
    previous = await SmartMeterReading.find_one(
        SmartMeterReading.device_id == payload.device_id,
        sort=[("-timestamp", -1)],
    )

    anomaly_reason = _detect_anomalies(payload.reading_kwh, previous, ts)

    reading = SmartMeterReading(
        device_id=payload.device_id,
        producer_id=PydanticObjectId(payload.producer_id),
        reading_kwh=payload.reading_kwh,
        previous_reading_kwh=previous.reading_kwh if previous else None,
        status=MeterReadingStatus.ANOMALY if anomaly_reason else MeterReadingStatus.SYNCED,
        anomaly_reason=anomaly_reason,
        timestamp=ts,
    )
    await reading.insert()

    if anomaly_reason:
        logger.warning(
            "Anomaly detected – device=%s reason=%s reading=%.2f kWh",
            payload.device_id,
            anomaly_reason,
            payload.reading_kwh,
        )
    else:
        logger.debug("Reading ingested – device=%s %.2f kWh", payload.device_id, payload.reading_kwh)

    return _reading_to_response(reading)


async def ingest_batch(readings: List[MeterReadingIngestRequest]) -> List[MeterReadingResponse]:
    """Ingest multiple readings sequentially to preserve ordering for anomaly detection."""
    results: list[MeterReadingResponse] = []
    for r in readings:
        result = await ingest_reading(r)
        results.append(result)
    return results


async def list_readings(
    device_id: Optional[str] = None,
    producer_id: Optional[str] = None,
    status_filter: Optional[MeterReadingStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> MeterReadingListResponse:
    conditions: dict = {}
    if device_id:
        conditions["device_id"] = device_id
    if producer_id:
        conditions["producer_id"] = PydanticObjectId(producer_id)
    if status_filter:
        conditions["status"] = status_filter.value

    total = await SmartMeterReading.find(conditions).count()
    items = (
        await SmartMeterReading.find(conditions)
        .sort("-timestamp")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return MeterReadingListResponse(
        total=total,
        items=[_reading_to_response(r) for r in items],
    )


async def get_anomaly_report(device_id: str) -> AnomalyReport:
    """Generate an anomaly report for a specific device."""
    total = await SmartMeterReading.find(SmartMeterReading.device_id == device_id).count()
    anomaly_count = await SmartMeterReading.find(
        SmartMeterReading.device_id == device_id,
        SmartMeterReading.status == MeterReadingStatus.ANOMALY,
    ).count()

    recent = (
        await SmartMeterReading.find(
            SmartMeterReading.device_id == device_id,
            SmartMeterReading.status == MeterReadingStatus.ANOMALY,
        )
        .sort("-timestamp")
        .limit(10)
        .to_list()
    )

    return AnomalyReport(
        device_id=device_id,
        total_readings=total,
        anomalies=anomaly_count,
        anomaly_rate=round(anomaly_count / total, 4) if total > 0 else 0.0,
        recent_anomalies=[_reading_to_response(r) for r in recent],
    )
