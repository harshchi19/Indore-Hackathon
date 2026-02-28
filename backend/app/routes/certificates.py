from fastapi import APIRouter, Query, status
from typing import Optional

from app.schemas.certificates import (
    CertificateCreate,
    CertificateResponse,
    CertificateVerifyRequest,
    CertificateVerifyResponse,
    CertificateListResponse,
    CertificateInvalidateRequest
)
from app.services.certificate_service import CertificateService

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.post(
    "/",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Issue a new certificate"
)
async def issue_certificate(data: CertificateCreate):
    """
    Issue a new I-REC/G-GO compatible certificate.
    
    - Generates unique certificate number
    - Computes SHA-256 hash
    - Calculates CO2 avoided
    - Sets expiration date
    """
    return await CertificateService.issue_certificate(data)


@router.get(
    "/{certificate_id}",
    response_model=CertificateResponse,
    summary="Get certificate by ID"
)
async def get_certificate(certificate_id: str):
    """Get certificate details by ID."""
    return await CertificateService.get_certificate(certificate_id)


@router.get(
    "/by-contract/{contract_id}",
    response_model=CertificateResponse,
    summary="Get certificate by contract ID"
)
async def get_certificate_by_contract(contract_id: str):
    """Get certificate issued for a specific contract."""
    result = await CertificateService.get_by_contract(contract_id)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No certificate found for contract {contract_id}"
        )
    return result


@router.get(
    "/",
    response_model=CertificateListResponse,
    summary="List certificates"
)
async def list_certificates(
    producer_id: Optional[str] = Query(None, description="Filter by producer ID"),
    valid_only: bool = Query(False, description="Return only valid certificates"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List certificates with optional filters."""
    return await CertificateService.list_certificates(
        producer_id=producer_id,
        valid_only=valid_only,
        page=page,
        page_size=page_size
    )


@router.post(
    "/verify",
    response_model=CertificateVerifyResponse,
    summary="Verify a certificate"
)
async def verify_certificate(data: CertificateVerifyRequest):
    """
    Verify a certificate's authenticity.
    
    Checks:
    - Certificate exists
    - Certificate is not expired
    - Hash matches (if provided)
    - Certificate has not been invalidated
    """
    return await CertificateService.verify_certificate(
        certificate_id=data.certificate_id,
        expected_hash=data.certificate_hash
    )


@router.post(
    "/invalidate",
    response_model=CertificateResponse,
    summary="Invalidate a certificate"
)
async def invalidate_certificate(data: CertificateInvalidateRequest):
    """
    Invalidate a certificate.
    
    - Marks certificate as invalid
    - Records invalidation reason
    """
    return await CertificateService.invalidate_certificate(
        certificate_id=data.certificate_id,
        reason=data.reason
    )


@router.post(
    "/check-expiry",
    summary="Check and expire certificates"
)
async def check_expiry():
    """
    Check all certificates and mark expired ones as invalid.
    
    Returns count of newly expired certificates.
    """
    count = await CertificateService.check_and_expire_certificates()
    return {
        "expired_count": count,
        "message": f"Marked {count} certificate(s) as expired"
    }
