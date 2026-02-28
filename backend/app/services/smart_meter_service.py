from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status

from app.models.smart_meter import SmartMeterReading, SmartMeterDevice
from app.schemas.smart_meter import (
    SmartMeterReadingCreate,
    SmartMeterReadingResponse,
    SmartMeterDeviceCreate,
    SmartMeterDeviceResponse,
    SmartMeterAnomalyReport
)


# In-memory stores for testing
_readings_store: Dict[str, dict] = {}
_devices_store: Dict[str, dict] = {}


class SmartMeterService:
    """Service for smart meter operations with anti-fraud detection."""
    
    # Anti-fraud thresholds
    MAX_READING_JUMP_PERCENT = 500  # Maximum % increase between readings
    MIN_INTERVAL_SECONDS = 60  # Minimum interval between readings
    MAX_INTERVAL_SECONDS = 86400  # Maximum interval (24 hours)
    
    @staticmethod
    def _generate_id() -> str:
        return str(ObjectId())
    
    @staticmethod
    async def register_device(data: SmartMeterDeviceCreate) -> SmartMeterDeviceResponse:
        """Register a new smart meter device."""
        # Check if device already exists
        for device in _devices_store.values():
            if device["device_id"] == data.device_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Device {data.device_id} already registered"
                )
        
        device_doc_id = SmartMeterService._generate_id()
        now = datetime.utcnow()
        
        device = SmartMeterDevice(
            id=ObjectId(device_doc_id),
            device_id=data.device_id,
            producer_id=ObjectId(data.producer_id),
            device_type=data.device_type,
            location=data.location,
            is_active=True,
            created_at=now
        )
        
        device_data = device.to_mongo()
        device_data["_id"] = device_doc_id
        _devices_store[device_doc_id] = device_data
        
        return SmartMeterService._device_to_response(device_data)
    
    @staticmethod
    async def get_device(device_id: str) -> Optional[SmartMeterDeviceResponse]:
        """Get device by device_id."""
        for device in _devices_store.values():
            if device["device_id"] == device_id:
                return SmartMeterService._device_to_response(device)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device {device_id} not found"
        )
    
    @staticmethod
    async def submit_reading(data: SmartMeterReadingCreate) -> SmartMeterReadingResponse:
        """Submit a meter reading with anti-fraud detection."""
        reading_id = SmartMeterService._generate_id()
        timestamp = data.timestamp or datetime.utcnow()
        
        # Get previous reading for this device
        previous_reading = SmartMeterService._get_last_reading(data.device_id)
        
        # Perform anti-fraud checks
        anomaly_reason = SmartMeterService._detect_anomaly(
            data.reading_kwh,
            previous_reading,
            timestamp
        )
        
        reading = SmartMeterReading(
            id=ObjectId(reading_id),
            device_id=data.device_id,
            producer_id=ObjectId(data.producer_id),
            reading_kwh=data.reading_kwh,
            previous_reading_kwh=previous_reading.get("reading_kwh") if previous_reading else None,
            status="anomaly" if anomaly_reason else "synced",
            anomaly_reason=anomaly_reason,
            interval_seconds=SmartMeterService._calc_interval(previous_reading, timestamp),
            timestamp=timestamp,
            processed=False
        )
        
        reading_data = reading.to_mongo()
        reading_data["_id"] = reading_id
        _readings_store[reading_id] = reading_data
        
        # Update device last reading
        SmartMeterService._update_device_reading(data.device_id, data.reading_kwh, timestamp)
        
        return SmartMeterService._reading_to_response(reading_data)
    
    @staticmethod
    async def get_reading(reading_id: str) -> SmartMeterReadingResponse:
        """Get a reading by ID."""
        reading = _readings_store.get(reading_id)
        if not reading:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reading {reading_id} not found"
            )
        return SmartMeterService._reading_to_response(reading)
    
    @staticmethod
    async def list_readings(
        device_id: Optional[str] = None,
        producer_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """List readings with filters."""
        readings = list(_readings_store.values())
        
        if device_id:
            readings = [r for r in readings if r.get("device_id") == device_id]
        if producer_id:
            readings = [r for r in readings if str(r.get("producer_id")) == producer_id]
        if status_filter:
            readings = [r for r in readings if r.get("status") == status_filter]
        
        # Sort by timestamp descending
        readings.sort(key=lambda x: x.get("timestamp", datetime.min), reverse=True)
        
        total = len(readings)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = readings[start:end]
        
        return {
            "readings": [SmartMeterService._reading_to_response(r) for r in paginated],
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    @staticmethod
    async def get_anomaly_report(
        device_id: Optional[str] = None,
        producer_id: Optional[str] = None
    ) -> SmartMeterAnomalyReport:
        """Generate anomaly report for a device or producer."""
        readings = list(_readings_store.values())
        
        if device_id:
            readings = [r for r in readings if r.get("device_id") == device_id]
        if producer_id:
            readings = [r for r in readings if str(r.get("producer_id")) == producer_id]
        
        anomalies = [r for r in readings if r.get("status") == "anomaly"]
        
        return SmartMeterAnomalyReport(
            device_id=device_id or "all",
            producer_id=producer_id or "all",
            total_readings=len(readings),
            anomaly_count=len(anomalies),
            anomaly_rate=len(anomalies) / len(readings) if readings else 0,
            anomalies=[SmartMeterService._reading_to_response(a) for a in anomalies[:10]]
        )
    
    @staticmethod
    def _get_last_reading(device_id: str) -> Optional[dict]:
        """Get the most recent reading for a device."""
        device_readings = [
            r for r in _readings_store.values()
            if r.get("device_id") == device_id
        ]
        if not device_readings:
            return None
        return max(device_readings, key=lambda x: x.get("timestamp", datetime.min))
    
    @staticmethod
    def _detect_anomaly(
        reading_kwh: float,
        previous: Optional[dict],
        timestamp: datetime
    ) -> Optional[str]:
        """Detect anomalies in meter reading."""
        anomalies = []
        
        # Check for negative reading
        if reading_kwh < 0:
            anomalies.append("Negative reading detected")
        
        if previous:
            prev_reading = previous.get("reading_kwh", 0)
            prev_timestamp = previous.get("timestamp")
            
            # Check for negative jump (reading decreased)
            if reading_kwh < prev_reading:
                anomalies.append(f"Reading decreased from {prev_reading} to {reading_kwh}")
            
            # Check for large jump
            if prev_reading > 0:
                increase_percent = ((reading_kwh - prev_reading) / prev_reading) * 100
                if increase_percent > SmartMeterService.MAX_READING_JUMP_PERCENT:
                    anomalies.append(f"Large reading jump: {increase_percent:.1f}% increase")
            
            # Check interval
            if prev_timestamp:
                if isinstance(prev_timestamp, str):
                    prev_timestamp = datetime.fromisoformat(prev_timestamp)
                interval = (timestamp - prev_timestamp).total_seconds()
                
                if interval < SmartMeterService.MIN_INTERVAL_SECONDS:
                    anomalies.append(f"Interval too short: {interval}s < {SmartMeterService.MIN_INTERVAL_SECONDS}s")
                elif interval > SmartMeterService.MAX_INTERVAL_SECONDS:
                    anomalies.append(f"Interval gap detected: {interval}s > {SmartMeterService.MAX_INTERVAL_SECONDS}s")
        
        return "; ".join(anomalies) if anomalies else None
    
    @staticmethod
    def _calc_interval(previous: Optional[dict], timestamp: datetime) -> Optional[int]:
        """Calculate interval since last reading."""
        if not previous:
            return None
        prev_timestamp = previous.get("timestamp")
        if not prev_timestamp:
            return None
        if isinstance(prev_timestamp, str):
            prev_timestamp = datetime.fromisoformat(prev_timestamp)
        return int((timestamp - prev_timestamp).total_seconds())
    
    @staticmethod
    def _update_device_reading(device_id: str, reading_kwh: float, timestamp: datetime):
        """Update device's last reading info."""
        for doc_id, device in _devices_store.items():
            if device["device_id"] == device_id:
                device["last_reading_kwh"] = reading_kwh
                device["last_reading_at"] = timestamp
                _devices_store[doc_id] = device
                break
    
    @staticmethod
    def _reading_to_response(reading: dict) -> SmartMeterReadingResponse:
        return SmartMeterReadingResponse(
            _id=str(reading["_id"]),
            device_id=reading["device_id"],
            producer_id=str(reading["producer_id"]),
            reading_kwh=reading["reading_kwh"],
            previous_reading_kwh=reading.get("previous_reading_kwh"),
            status=reading["status"],
            anomaly_reason=reading.get("anomaly_reason"),
            timestamp=reading["timestamp"],
            processed=reading.get("processed", False)
        )
    
    @staticmethod
    def _device_to_response(device: dict) -> SmartMeterDeviceResponse:
        return SmartMeterDeviceResponse(
            _id=str(device["_id"]),
            device_id=device["device_id"],
            producer_id=str(device["producer_id"]),
            device_type=device.get("device_type", "electricity"),
            location=device.get("location"),
            last_reading_kwh=device.get("last_reading_kwh"),
            last_reading_at=device.get("last_reading_at"),
            is_active=device.get("is_active", True),
            created_at=device["created_at"]
        )


smart_meter_service = SmartMeterService()
