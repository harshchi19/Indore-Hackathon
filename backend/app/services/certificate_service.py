from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
import uuid

from app.models.certificates import CertificateDocument
from app.schemas.certificates import (
    CertificateCreate,
    CertificateResponse,
    CertificateVerifyResponse
)
from app.core.hashing import compute_sha256_hash, verify_sha256_hash
from app.core.config import settings


# In-memory store for testing
_certificates_store: Dict[str, dict] = {}


class CertificateService:
    """Service for I-REC / G-GO certificate operations."""
    
    @staticmethod
    def _generate_id() -> str:
        return str(ObjectId())
    
    @staticmethod
    def _generate_certificate_number() -> str:
        """Generate unique certificate number."""
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        unique_id = uuid.uuid4().hex[:8].upper()
        return f"IREC-{timestamp}-{unique_id}"
    
    @staticmethod
    async def issue_certificate(data: CertificateCreate) -> CertificateResponse:
        """Issue a new certificate."""
        cert_id = CertificateService._generate_id()
        now = datetime.utcnow()
        expires_at = now + timedelta(days=data.validity_days)
        
        # Calculate CO2 avoided
        co2_avoided = data.energy_amount_kwh * settings.CO2_BASELINE_FACTOR_KG_PER_KWH
        
        certificate = CertificateDocument(
            id=ObjectId(cert_id),
            contract_id=ObjectId(data.contract_id),
            producer_id=ObjectId(data.producer_id),
            energy_amount_kwh=data.energy_amount_kwh,
            certificate_type=data.certificate_type,
            certificate_number=CertificateService._generate_certificate_number(),
            certificate_hash="",  # Will be set below
            issued_at=now,
            expires_at=expires_at,
            valid=True,
            energy_source=data.energy_source,
            co2_avoided_kg=co2_avoided
        )
        
        # Generate certificate hash
        cert_hash = compute_sha256_hash(certificate.get_hashable_content())
        certificate.certificate_hash = cert_hash
        
        cert_data = certificate.to_mongo()
        cert_data["_id"] = cert_id
        cert_data["certificate_hash"] = cert_hash
        _certificates_store[cert_id] = cert_data
        
        return CertificateService._to_response(cert_data)
    
    @staticmethod
    async def get_certificate(certificate_id: str) -> CertificateResponse:
        """Get certificate by ID."""
        cert = _certificates_store.get(certificate_id)
        if not cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Certificate {certificate_id} not found"
            )
        return CertificateService._to_response(cert)
    
    @staticmethod
    async def get_by_contract(contract_id: str) -> Optional[CertificateResponse]:
        """Get certificate by contract ID."""
        for cert in _certificates_store.values():
            if str(cert.get("contract_id")) == contract_id:
                return CertificateService._to_response(cert)
        return None
    
    @staticmethod
    async def list_certificates(
        producer_id: Optional[str] = None,
        valid_only: bool = False,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """List certificates with filters."""
        certs = list(_certificates_store.values())
        
        if producer_id:
            certs = [c for c in certs if str(c.get("producer_id")) == producer_id]
        if valid_only:
            certs = [c for c in certs if c.get("valid", False)]
        
        # Check for expired certificates and update
        now = datetime.utcnow()
        for cert in certs:
            expires_at = cert.get("expires_at")
            if expires_at:
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if now > expires_at and cert.get("valid"):
                    cert["valid"] = False
                    cert["invalidation_reason"] = "Certificate expired"
        
        total = len(certs)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = certs[start:end]
        
        return {
            "certificates": [CertificateService._to_response(c) for c in paginated],
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    @staticmethod
    async def verify_certificate(
        certificate_id: str,
        expected_hash: Optional[str] = None
    ) -> CertificateVerifyResponse:
        """Verify a certificate's authenticity."""
        cert = _certificates_store.get(certificate_id)
        if not cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Certificate {certificate_id} not found"
            )
        
        # Check expiry
        is_expired = False
        expires_at = cert.get("expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            is_expired = datetime.utcnow() > expires_at
        
        # Verify hash if provided
        hash_matches = True
        if expected_hash:
            hash_matches = cert.get("certificate_hash") == expected_hash
        
        is_valid = cert.get("valid", False) and not is_expired and hash_matches
        
        message = "Certificate is valid"
        if is_expired:
            message = "Certificate has expired"
        elif not cert.get("valid"):
            message = f"Certificate invalid: {cert.get('invalidation_reason', 'Unknown reason')}"
        elif not hash_matches:
            message = "Certificate hash does not match"
        
        return CertificateVerifyResponse(
            certificate_id=certificate_id,
            is_valid=is_valid,
            hash_matches=hash_matches,
            is_expired=is_expired,
            certificate_number=cert.get("certificate_number", ""),
            verification_timestamp=datetime.utcnow(),
            message=message
        )
    
    @staticmethod
    async def invalidate_certificate(
        certificate_id: str,
        reason: str
    ) -> CertificateResponse:
        """Invalidate a certificate."""
        cert = _certificates_store.get(certificate_id)
        if not cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Certificate {certificate_id} not found"
            )
        
        cert["valid"] = False
        cert["invalidation_reason"] = reason
        _certificates_store[certificate_id] = cert
        
        return CertificateService._to_response(cert)
    
    @staticmethod
    async def check_and_expire_certificates() -> int:
        """Check all certificates and mark expired ones. Returns count of expired."""
        expired_count = 0
        now = datetime.utcnow()
        
        for cert_id, cert in _certificates_store.items():
            if not cert.get("valid"):
                continue
            
            expires_at = cert.get("expires_at")
            if expires_at:
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if now > expires_at:
                    cert["valid"] = False
                    cert["invalidation_reason"] = "Certificate expired"
                    _certificates_store[cert_id] = cert
                    expired_count += 1
        
        return expired_count
    
    @staticmethod
    def _to_response(cert: dict) -> CertificateResponse:
        return CertificateResponse(
            _id=str(cert["_id"]),
            contract_id=str(cert["contract_id"]),
            producer_id=str(cert["producer_id"]),
            energy_amount_kwh=cert["energy_amount_kwh"],
            certificate_type=cert.get("certificate_type", "I-REC"),
            certificate_hash=cert.get("certificate_hash", ""),
            certificate_number=cert.get("certificate_number", ""),
            issued_at=cert["issued_at"],
            expires_at=cert["expires_at"],
            valid=cert.get("valid", True),
            invalidation_reason=cert.get("invalidation_reason"),
            energy_source=cert.get("energy_source", "solar"),
            co2_avoided_kg=cert.get("co2_avoided_kg", 0)
        )


certificate_service = CertificateService()
