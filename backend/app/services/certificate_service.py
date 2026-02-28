"""
Verdant Backend – Certificate service (Part B)
Issuance, SHA-256 hashing, verification, and expiry management.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.db.base import EnergySource
from app.models.certificates import Certificate
from app.models.contracts import Contract, ContractStatus
from app.schemas.certificates import (
    CertificateIssueRequest,
    CertificateListResponse,
    CertificateResponse,
    CertificateVerifyResponse,
)

logger = get_logger("services.certificate")


def _cert_to_response(c: Certificate) -> CertificateResponse:
    return CertificateResponse(
        id=str(c.id),
        contract_id=str(c.contract_id),
        producer_id=str(c.producer_id),
        buyer_id=str(c.buyer_id),
        energy_source=c.energy_source,
        energy_amount_kwh=c.energy_amount_kwh,
        certificate_hash=c.certificate_hash,
        issued_at=c.issued_at,
        expires_at=c.expires_at,
        valid=c.valid,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _hash_certificate(cert: Certificate) -> str:
    """Generate SHA-256 digest of the immutable certificate fields."""
    payload = {
        "certificate_id": str(cert.id),
        "contract_id": str(cert.contract_id),
        "producer_id": str(cert.producer_id),
        "buyer_id": str(cert.buyer_id),
        "energy_source": cert.energy_source.value,
        "energy_amount_kwh": cert.energy_amount_kwh,
        "issued_at": cert.issued_at.isoformat(),
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def issue_certificate(payload: CertificateIssueRequest) -> CertificateResponse:
    """Issue a new green energy certificate for a settled contract."""
    contract = await Contract.get(PydanticObjectId(payload.contract_id))
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    if contract.status != ContractStatus.SETTLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contract must be settled to issue certificate (current: {contract.status.value})",
        )

    # Check for existing certificate
    existing = await Certificate.find_one(
        Certificate.contract_id == contract.id, Certificate.valid == True
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A valid certificate already exists for this contract",
        )

    now = datetime.now(timezone.utc)
    cert = Certificate(
        contract_id=contract.id,
        producer_id=contract.producer_id,
        buyer_id=contract.buyer_id,
        energy_source=payload.energy_source,
        energy_amount_kwh=contract.volume_kwh,
        issued_at=now,
        expires_at=now + timedelta(days=payload.validity_days),
    )
    await cert.insert()

    cert.certificate_hash = _hash_certificate(cert)
    await cert.save()

    logger.info(
        "Certificate issued: %s for contract %s (%s kWh)",
        str(cert.id),
        str(contract.id),
        contract.volume_kwh,
    )
    return _cert_to_response(cert)


async def verify_certificate(certificate_id: str) -> CertificateVerifyResponse:
    """Verify a certificate's integrity and validity."""
    cert = await Certificate.get(PydanticObjectId(certificate_id))
    if cert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

    now = datetime.now(timezone.utc)
    expired = cert.expires_at is not None and now > cert.expires_at

    # Recompute hash and compare
    expected_hash = _hash_certificate(cert)
    hash_match = cert.certificate_hash == expected_hash

    # Auto-invalidate if expired
    if expired and cert.valid:
        cert.valid = False
        await cert.save()
        logger.info("Certificate %s marked invalid (expired)", str(cert.id))

    valid = cert.valid and hash_match and not expired

    detail_parts = []
    if not hash_match:
        detail_parts.append("hash mismatch (tampered)")
    if expired:
        detail_parts.append("certificate expired")
    if not cert.valid:
        detail_parts.append("marked invalid")

    return CertificateVerifyResponse(
        certificate_id=str(cert.id),
        valid=valid,
        hash_match=hash_match,
        expired=expired,
        detail="Certificate is valid" if valid else "; ".join(detail_parts),
    )


async def get_certificate(certificate_id: str) -> CertificateResponse:
    cert = await Certificate.get(PydanticObjectId(certificate_id))
    if cert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    return _cert_to_response(cert)


async def list_certificates(
    contract_id: Optional[str] = None,
    producer_id: Optional[str] = None,
    valid_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> CertificateListResponse:
    conditions: dict = {}
    if contract_id:
        conditions["contract_id"] = PydanticObjectId(contract_id)
    if producer_id:
        conditions["producer_id"] = PydanticObjectId(producer_id)
    if valid_only:
        conditions["valid"] = True

    total = await Certificate.find(conditions).count()
    items = await Certificate.find(conditions).skip(skip).limit(limit).to_list()
    return CertificateListResponse(
        total=total,
        items=[_cert_to_response(c) for c in items],
    )


async def issue_for_contract(contract_id: str, energy_source: EnergySource = EnergySource.SOLAR) -> CertificateResponse:
    """Convenience wrapper used by the certificate worker."""
    return await issue_certificate(
        CertificateIssueRequest(contract_id=contract_id, energy_source=energy_source)
    )
