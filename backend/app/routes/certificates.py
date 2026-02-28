"""
Verdant Backend – Certificate routes (Part B)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import _get_current_user
from app.models.users import User
from app.schemas.certificates import (
    CertificateIssueRequest,
    CertificateListResponse,
    CertificateResponse,
    CertificateVerifyResponse,
)
from app.services import certificate_service

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.post(
    "",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Issue a green energy certificate",
)
async def issue_certificate(
    payload: CertificateIssueRequest,
    current_user: User = Depends(_get_current_user),
) -> CertificateResponse:
    return await certificate_service.issue_certificate(payload)


@router.get(
    "",
    response_model=CertificateListResponse,
    summary="List certificates",
)
async def list_certificates(
    contract_id: Optional[str] = Query(default=None),
    producer_id: Optional[str] = Query(default=None),
    valid_only: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(_get_current_user),
) -> CertificateListResponse:
    return await certificate_service.list_certificates(contract_id, producer_id, valid_only, skip, limit)


@router.get(
    "/{certificate_id}",
    response_model=CertificateResponse,
    summary="Get certificate details",
)
async def get_certificate(
    certificate_id: str,
    current_user: User = Depends(_get_current_user),
) -> CertificateResponse:
    return await certificate_service.get_certificate(certificate_id)


@router.post(
    "/{certificate_id}/verify",
    response_model=CertificateVerifyResponse,
    summary="Verify certificate integrity and validity",
)
async def verify_certificate(
    certificate_id: str,
) -> CertificateVerifyResponse:
    return await certificate_service.verify_certificate(certificate_id)
