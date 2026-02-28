from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CarbonImpactResponse(BaseModel):
    """Schema for carbon impact response."""
    
    contract_id: str
    volume_kwh: float
    co2_avoided_kg: float
    co2_baseline_factor: float
    energy_source: str
    calculated_at: datetime


class MonthlyAnalytics(BaseModel):
    """Schema for monthly analytics."""
    
    year: int
    month: int
    total_kwh_traded: float
    total_contracts: int
    total_co2_avoided_kg: float
    average_price_per_kwh: float
    unique_producers: int
    unique_buyers: int


class ProducerPerformance(BaseModel):
    """Schema for producer performance analytics."""
    
    producer_id: str
    total_kwh_sold: float
    total_contracts: int
    total_revenue: float
    average_rating: Optional[float] = None
    co2_avoided_kg: float
    energy_sources: List[str]


class DashboardAnalytics(BaseModel):
    """Schema for dashboard analytics response."""
    
    total_kwh_traded: float
    total_co2_avoided_kg: float
    total_contracts: int
    active_producers: int
    active_buyers: int
    average_price_per_kwh: float
    monthly_trends: List[MonthlyAnalytics]
    top_producers: List[ProducerPerformance]
    last_updated: datetime


class CarbonReportRequest(BaseModel):
    """Schema for carbon report request."""
    
    producer_id: Optional[str] = None
    buyer_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    energy_source: Optional[str] = None


class CarbonReportResponse(BaseModel):
    """Schema for carbon report response."""
    
    report_id: str
    period_start: datetime
    period_end: datetime
    total_kwh: float
    total_co2_avoided_kg: float
    co2_in_tonnes: float
    breakdown_by_source: dict
    breakdown_by_month: List[dict]
    generated_at: datetime


class GHGBaselineFactors(BaseModel):
    """Schema for GHG baseline factors."""
    
    region: str
    grid_emission_factor: float  # kg CO2/kWh
    solar_factor: float
    wind_factor: float
    hydro_factor: float
    biomass_factor: float
    last_updated: datetime
