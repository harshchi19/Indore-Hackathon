"""
Verdant Backend – Carbon Analytics routes (Part B)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.auth import _get_current_user
from app.models.users import User
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Carbon Analytics"])


@router.get(
    "/co2/{contract_id}",
    summary="Compute CO₂ avoided for a specific contract",
)
async def co2_for_contract(
    contract_id: str,
    current_user: User = Depends(_get_current_user),
) -> dict:
    return await analytics_service.compute_co2_avoided(contract_id)


@router.get(
    "/monthly",
    summary="Monthly aggregated carbon analytics",
)
async def monthly_analytics(
    year: int = Query(..., ge=2020, le=2100),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    producer_id: Optional[str] = Query(default=None),
    current_user: User = Depends(_get_current_user),
) -> list[dict]:
    return await analytics_service.monthly_aggregation(year, month, producer_id)


@router.get(
    "/dashboard",
    summary="Carbon analytics dashboard summary",
)
async def dashboard(
    producer_id: Optional[str] = Query(default=None),
    current_user: User = Depends(_get_current_user),
) -> dict:
    return await analytics_service.dashboard_summary(producer_id)


@router.get(
    "/producers/performance",
    summary="Top producers by volume and CO₂ impact",
)
async def producer_performance(
    top_n: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(_get_current_user),
) -> list[dict]:
    return await analytics_service.producer_performance(top_n)
