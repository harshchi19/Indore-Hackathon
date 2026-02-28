from fastapi import APIRouter

from app.workers.certificate_worker import CertificateWorker
from app.workers.smart_meter_worker import SmartMeterWorker
from app.workers.analytics_worker import AnalyticsWorker

router = APIRouter(prefix="/workers", tags=["Workers (Background Jobs)"])


# ============ Certificate Worker Endpoints ============

@router.post("/certificates/issue-for-settled", summary="Issue certificates for all settled contracts")
async def issue_certificates_for_settled():
    """
    Check all settled contracts and issue certificates for those without one.
    Simulates a scheduled worker job.
    """
    return await CertificateWorker.issue_for_settled_contracts()


@router.post("/certificates/check-expiry", summary="Check and expire certificates")
async def check_certificate_expiry():
    """Check all certificates and mark expired ones as invalid."""
    return await CertificateWorker.check_expirations()


@router.get("/certificates/queue", summary="Get certificate queue status")
async def get_certificate_queue():
    """Get current certificate processing queue status."""
    return CertificateWorker.get_queue_status()


@router.post("/certificates/process-queue", summary="Process pending certificate tasks")
async def process_certificate_queue():
    """Process all pending certificate issuance tasks."""
    return await CertificateWorker.process_pending_tasks()


# ============ Smart Meter Worker Endpoints ============

@router.post("/meters/process-readings", summary="Process unprocessed meter readings")
async def process_meter_readings():
    """Process all unprocessed meter readings."""
    return await SmartMeterWorker.process_unprocessed_readings()


@router.post("/meters/aggregate/{producer_id}", summary="Aggregate readings for a producer")
async def aggregate_producer_readings(producer_id: str):
    """Aggregate all readings for a specific producer."""
    return await SmartMeterWorker.aggregate_producer_readings(producer_id)


@router.post("/meters/detect-anomalies/{device_id}", summary="Detect anomalies for a device")
async def detect_device_anomalies(device_id: str):
    """Run comprehensive anomaly detection for a device."""
    return await SmartMeterWorker.detect_device_anomalies(device_id)


@router.post("/meters/sync-status", summary="Sync device status")
async def sync_device_status():
    """Check and update device online/offline status."""
    return await SmartMeterWorker.sync_device_status()


@router.get("/meters/queue", summary="Get meter processing queue status")
async def get_meter_queue():
    """Get current meter reading processing queue status."""
    return SmartMeterWorker.get_queue_status()


# ============ Analytics Worker Endpoints ============

@router.post("/analytics/compute-dashboard", summary="Compute and cache dashboard analytics")
async def compute_dashboard():
    """Compute dashboard analytics and cache results."""
    return await AnalyticsWorker.compute_and_cache_dashboard()


@router.post("/analytics/compute-monthly", summary="Compute monthly aggregations")
async def compute_monthly(year: int = None, month: int = None):
    """Compute monthly aggregations."""
    return await AnalyticsWorker.compute_monthly_aggregations(year, month)


@router.post("/analytics/compute-rankings", summary="Compute producer rankings")
async def compute_rankings():
    """Compute producer performance rankings."""
    return await AnalyticsWorker.compute_producer_rankings()


@router.post("/analytics/daily-summary", summary="Generate daily summary")
async def generate_daily_summary():
    """Generate daily summary report."""
    return await AnalyticsWorker.generate_daily_summary()


@router.post("/analytics/cleanup-cache", summary="Cleanup expired cache")
async def cleanup_cache():
    """Clean up expired cache entries."""
    return await AnalyticsWorker.cleanup_old_cache()


@router.get("/analytics/cache-status", summary="Get analytics cache status")
async def get_cache_status():
    """Get current analytics cache status."""
    return AnalyticsWorker.get_cache_status()
