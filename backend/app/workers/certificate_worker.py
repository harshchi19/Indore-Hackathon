"""
Certificate Worker

Handles asynchronous certificate issuance when contracts are settled.
Can be integrated with Celery or RQ for production use.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import asyncio

from app.services.certificate_service import CertificateService
from app.services.contract_service import _contracts_store
from app.schemas.certificates import CertificateCreate
from app.core.config import settings


class CertificateWorker:
    """Worker for async certificate processing."""
    
    # Queue for pending certificate tasks
    _task_queue: list = []
    
    @staticmethod
    async def queue_certificate_issuance(
        contract_id: str,
        producer_id: str,
        energy_amount_kwh: float,
        energy_source: str = "solar"
    ) -> Dict[str, Any]:
        """
        Queue a certificate for async issuance.
        
        In production, this would push to Celery/RQ.
        """
        task = {
            "task_id": f"CERT-TASK-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "contract_id": contract_id,
            "producer_id": producer_id,
            "energy_amount_kwh": energy_amount_kwh,
            "energy_source": energy_source,
            "status": "queued",
            "queued_at": datetime.utcnow()
        }
        CertificateWorker._task_queue.append(task)
        return task
    
    @staticmethod
    async def process_certificate_task(task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single certificate issuance task."""
        try:
            task["status"] = "processing"
            task["started_at"] = datetime.utcnow()
            
            # Issue the certificate
            cert_data = CertificateCreate(
                contract_id=task["contract_id"],
                producer_id=task["producer_id"],
                energy_amount_kwh=task["energy_amount_kwh"],
                energy_source=task["energy_source"],
                validity_days=365
            )
            
            certificate = await CertificateService.issue_certificate(cert_data)
            
            task["status"] = "completed"
            task["completed_at"] = datetime.utcnow()
            task["certificate_id"] = certificate.id
            task["certificate_number"] = certificate.certificate_number
            
            return task
            
        except Exception as e:
            task["status"] = "failed"
            task["error"] = str(e)
            task["failed_at"] = datetime.utcnow()
            return task
    
    @staticmethod
    async def process_pending_tasks() -> Dict[str, Any]:
        """Process all pending certificate tasks."""
        results = {
            "processed": 0,
            "succeeded": 0,
            "failed": 0,
            "tasks": []
        }
        
        for task in CertificateWorker._task_queue:
            if task["status"] == "queued":
                result = await CertificateWorker.process_certificate_task(task)
                results["processed"] += 1
                if result["status"] == "completed":
                    results["succeeded"] += 1
                else:
                    results["failed"] += 1
                results["tasks"].append(result)
        
        return results
    
    @staticmethod
    async def issue_for_settled_contracts() -> Dict[str, Any]:
        """
        Check for settled contracts without certificates and issue them.
        This simulates a scheduled worker job.
        """
        issued = []
        
        for contract_id, contract in _contracts_store.items():
            if contract.get("status") == "settled":
                # Check if certificate already exists
                existing = await CertificateService.get_by_contract(contract_id)
                if not existing:
                    cert_data = CertificateCreate(
                        contract_id=contract_id,
                        producer_id=str(contract["producer_id"]),
                        energy_amount_kwh=contract["volume_kwh"],
                        energy_source="solar",  # Default, would come from producer profile
                        validity_days=365
                    )
                    cert = await CertificateService.issue_certificate(cert_data)
                    issued.append({
                        "contract_id": contract_id,
                        "certificate_id": cert.id,
                        "certificate_number": cert.certificate_number
                    })
        
        return {
            "checked_contracts": len(_contracts_store),
            "certificates_issued": len(issued),
            "certificates": issued
        }
    
    @staticmethod
    async def check_expirations() -> Dict[str, Any]:
        """Check and expire certificates that have passed their expiry date."""
        expired_count = await CertificateService.check_and_expire_certificates()
        return {
            "checked_at": datetime.utcnow(),
            "expired_certificates": expired_count
        }
    
    @staticmethod
    def get_queue_status() -> Dict[str, Any]:
        """Get current queue status."""
        status_counts = {
            "queued": 0,
            "processing": 0,
            "completed": 0,
            "failed": 0
        }
        for task in CertificateWorker._task_queue:
            status_counts[task["status"]] = status_counts.get(task["status"], 0) + 1
        
        return {
            "total_tasks": len(CertificateWorker._task_queue),
            "status_breakdown": status_counts,
            "queue": CertificateWorker._task_queue[-10:]  # Last 10 tasks
        }


certificate_worker = CertificateWorker()
