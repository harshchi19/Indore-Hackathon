"""
Smart Meter Worker

Handles asynchronous processing of meter readings.
Performs batch anomaly detection and aggregation.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import asyncio

from app.services.smart_meter_service import SmartMeterService, _readings_store, _devices_store


class SmartMeterWorker:
    """Worker for async smart meter processing."""
    
    # Queue for pending reading tasks
    _processing_queue: list = []
    
    @staticmethod
    async def queue_reading_processing(reading_id: str) -> Dict[str, Any]:
        """
        Queue a reading for async processing.
        
        In production, this would push to Celery/RQ.
        """
        task = {
            "task_id": f"METER-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "reading_id": reading_id,
            "status": "queued",
            "queued_at": datetime.utcnow()
        }
        SmartMeterWorker._processing_queue.append(task)
        return task
    
    @staticmethod
    async def process_unprocessed_readings() -> Dict[str, Any]:
        """Process all unprocessed meter readings."""
        results = {
            "processed": 0,
            "anomalies_found": 0,
            "synced": 0
        }
        
        for reading_id, reading in _readings_store.items():
            if not reading.get("processed", False):
                # Mark as processed
                reading["processed"] = True
                _readings_store[reading_id] = reading
                results["processed"] += 1
                
                if reading.get("status") == "anomaly":
                    results["anomalies_found"] += 1
                else:
                    results["synced"] += 1
        
        return results
    
    @staticmethod
    async def aggregate_producer_readings(
        producer_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Aggregate readings for a producer.
        Used for billing and verification.
        """
        readings = [
            r for r in _readings_store.values()
            if str(r.get("producer_id")) == producer_id
        ]
        
        if start_date:
            readings = [
                r for r in readings
                if r.get("timestamp", datetime.min) >= start_date
            ]
        if end_date:
            readings = [
                r for r in readings
                if r.get("timestamp", datetime.max) <= end_date
            ]
        
        total_readings = len(readings)
        synced_readings = [r for r in readings if r.get("status") == "synced"]
        anomaly_readings = [r for r in readings if r.get("status") == "anomaly"]
        
        # Calculate total energy (using delta between readings)
        # This is simplified - real implementation would track deltas
        total_kwh = sum(r.get("reading_kwh", 0) for r in synced_readings)
        
        return {
            "producer_id": producer_id,
            "period_start": start_date,
            "period_end": end_date,
            "total_readings": total_readings,
            "synced_readings": len(synced_readings),
            "anomaly_readings": len(anomaly_readings),
            "anomaly_rate": len(anomaly_readings) / total_readings if total_readings > 0 else 0,
            "total_kwh_reported": total_kwh,
            "aggregated_at": datetime.utcnow()
        }
    
    @staticmethod
    async def detect_device_anomalies(device_id: str) -> Dict[str, Any]:
        """
        Run comprehensive anomaly detection for a device.
        """
        readings = [
            r for r in _readings_store.values()
            if r.get("device_id") == device_id
        ]
        
        # Sort by timestamp
        readings.sort(key=lambda x: x.get("timestamp", datetime.min))
        
        anomalies = []
        for i, reading in enumerate(readings):
            if reading.get("status") == "anomaly":
                anomalies.append({
                    "reading_id": str(reading["_id"]),
                    "timestamp": reading.get("timestamp"),
                    "reading_kwh": reading.get("reading_kwh"),
                    "reason": reading.get("anomaly_reason")
                })
        
        # Detect patterns
        patterns = SmartMeterWorker._detect_patterns(readings)
        
        return {
            "device_id": device_id,
            "total_readings": len(readings),
            "anomaly_count": len(anomalies),
            "anomaly_rate": len(anomalies) / len(readings) if readings else 0,
            "anomalies": anomalies[-20:],  # Last 20 anomalies
            "patterns_detected": patterns,
            "analyzed_at": datetime.utcnow()
        }
    
    @staticmethod
    def _detect_patterns(readings: List[dict]) -> List[str]:
        """Detect suspicious patterns in readings."""
        patterns = []
        
        if len(readings) < 2:
            return patterns
        
        # Check for consistent identical readings (stuck meter)
        values = [r.get("reading_kwh", 0) for r in readings[-10:]]
        if len(set(values)) == 1 and len(values) > 3:
            patterns.append("STUCK_METER: Last readings are identical")
        
        # Check for consistent increases (might be fabricated)
        deltas = [
            readings[i].get("reading_kwh", 0) - readings[i-1].get("reading_kwh", 0)
            for i in range(1, len(readings[-10:]))
        ]
        if deltas and all(d == deltas[0] for d in deltas):
            patterns.append("UNIFORM_INCREASE: Readings show uniform increase pattern")
        
        # Check for too-perfect timing
        timestamps = [r.get("timestamp") for r in readings[-10:] if r.get("timestamp")]
        if len(timestamps) >= 2:
            intervals = []
            for i in range(1, len(timestamps)):
                if isinstance(timestamps[i], str):
                    timestamps[i] = datetime.fromisoformat(timestamps[i])
                if isinstance(timestamps[i-1], str):
                    timestamps[i-1] = datetime.fromisoformat(timestamps[i-1])
                intervals.append((timestamps[i] - timestamps[i-1]).total_seconds())
            
            if intervals and all(abs(i - intervals[0]) < 1 for i in intervals):
                patterns.append("PERFECT_TIMING: Readings at exactly uniform intervals")
        
        return patterns
    
    @staticmethod
    async def sync_device_status() -> Dict[str, Any]:
        """
        Sync device status based on recent readings.
        Marks devices as offline if no recent readings.
        """
        now = datetime.utcnow()
        offline_threshold = timedelta(hours=24)
        
        results = {
            "devices_checked": 0,
            "devices_online": 0,
            "devices_offline": 0,
            "offline_devices": []
        }
        
        for device_id, device in _devices_store.items():
            results["devices_checked"] += 1
            
            last_reading_at = device.get("last_reading_at")
            if last_reading_at:
                if isinstance(last_reading_at, str):
                    last_reading_at = datetime.fromisoformat(last_reading_at)
                
                if now - last_reading_at > offline_threshold:
                    device["is_active"] = False
                    results["devices_offline"] += 1
                    results["offline_devices"].append(device["device_id"])
                else:
                    device["is_active"] = True
                    results["devices_online"] += 1
            else:
                # No readings yet, might be newly registered
                results["devices_offline"] += 1
            
            _devices_store[device_id] = device
        
        return results
    
    @staticmethod
    def get_queue_status() -> Dict[str, Any]:
        """Get current processing queue status."""
        return {
            "total_tasks": len(SmartMeterWorker._processing_queue),
            "queue": SmartMeterWorker._processing_queue[-10:]
        }


smart_meter_worker = SmartMeterWorker()
