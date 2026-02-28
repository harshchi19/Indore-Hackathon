from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

from app.schemas.analytics import (
    CarbonImpactResponse,
    MonthlyAnalytics,
    ProducerPerformance,
    DashboardAnalytics,
    CarbonReportRequest,
    CarbonReportResponse,
    GHGBaselineFactors
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Carbon Analytics"])


@router.get(
    "/dashboard",
    response_model=DashboardAnalytics,
    summary="Get dashboard analytics"
)
async def get_dashboard_analytics():
    """
    Get comprehensive dashboard analytics.
    
    Returns:
    - Total kWh traded
    - Total CO2 avoided
    - Contract counts
    - Monthly trends
    - Top producers
    """
    return await AnalyticsService.get_dashboard_analytics()


@router.get(
    "/carbon-impact/{contract_id}",
    response_model=CarbonImpactResponse,
    summary="Compute carbon impact for a contract"
)
async def compute_carbon_impact(
    contract_id: str,
    volume_kwh: float = Query(..., gt=0),
    energy_source: str = Query("solar", description="Energy source: solar, wind, hydro, biomass")
):
    """
    Compute CO2 avoided for a specific contract.
    
    Uses GHG baseline factors to calculate:
    CO2_avoided = volume_kwh * (grid_factor - source_factor)
    """
    return await AnalyticsService.compute_carbon_impact(
        contract_id=contract_id,
        volume_kwh=volume_kwh,
        energy_source=energy_source
    )


@router.get(
    "/monthly",
    response_model=list[MonthlyAnalytics],
    summary="Get monthly analytics"
)
async def get_monthly_analytics(
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Filter by month")
):
    """Get monthly aggregated analytics."""
    return await AnalyticsService.get_monthly_analytics(year=year, month=month)


@router.get(
    "/producers",
    response_model=list[ProducerPerformance],
    summary="Get producer performance"
)
async def get_producer_performance(
    producer_id: Optional[str] = Query(None, description="Filter by producer ID"),
    limit: int = Query(10, ge=1, le=100, description="Number of results")
):
    """Get producer performance rankings."""
    return await AnalyticsService.get_producer_performance(
        producer_id=producer_id,
        limit=limit
    )


@router.post(
    "/carbon-report",
    response_model=CarbonReportResponse,
    summary="Generate carbon report"
)
async def generate_carbon_report(data: CarbonReportRequest):
    """
    Generate detailed carbon impact report.
    
    Returns:
    - Total kWh and CO2 avoided
    - Breakdown by energy source
    - Breakdown by month
    """
    return await AnalyticsService.generate_carbon_report(
        producer_id=data.producer_id,
        buyer_id=data.buyer_id,
        start_date=data.start_date,
        end_date=data.end_date,
        energy_source=data.energy_source
    )


@router.get(
    "/ghg-factors",
    response_model=GHGBaselineFactors,
    summary="Get GHG baseline factors"
)
async def get_ghg_factors(
    region: str = Query("india", description="Region for GHG factors")
):
    """
    Get GHG baseline emission factors.
    
    Returns emission factors (kg CO2/kWh) for:
    - Grid average
    - Solar
    - Wind
    - Hydro
    - Biomass
    """
    return await AnalyticsService.get_ghg_baseline_factors(region)


@router.get(
    "/summary",
    summary="Get quick summary stats"
)
async def get_summary():
    """Get quick summary statistics."""
    dashboard = await AnalyticsService.get_dashboard_analytics()
    return {
        "total_kwh_traded": dashboard.total_kwh_traded,
        "total_co2_avoided_kg": dashboard.total_co2_avoided_kg,
        "total_co2_avoided_tonnes": dashboard.total_co2_avoided_kg / 1000,
        "total_contracts": dashboard.total_contracts,
        "active_producers": dashboard.active_producers,
        "active_buyers": dashboard.active_buyers,
        "average_price_per_kwh": dashboard.average_price_per_kwh,
        "last_updated": dashboard.last_updated
    }
