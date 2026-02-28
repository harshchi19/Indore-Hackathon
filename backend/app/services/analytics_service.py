from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
import uuid

from app.schemas.analytics import (
    CarbonImpactResponse,
    MonthlyAnalytics,
    ProducerPerformance,
    DashboardAnalytics,
    CarbonReportResponse,
    GHGBaselineFactors
)
from app.core.config import settings
from app.services.contract_service import _contracts_store
from app.services.certificate_service import _certificates_store


class AnalyticsService:
    """Service for carbon analytics and reporting."""
    
    # GHG baseline factors by energy source (kg CO2/kWh)
    GHG_FACTORS = {
        "solar": 0.0,  # Zero direct emissions
        "wind": 0.0,
        "hydro": 0.0,
        "biomass": 0.018,
        "grid": 0.4,  # Average grid emission factor
    }
    
    @staticmethod
    async def compute_carbon_impact(
        contract_id: str,
        volume_kwh: float,
        energy_source: str = "solar"
    ) -> CarbonImpactResponse:
        """Compute CO2 avoided for a contract."""
        # Grid baseline factor
        grid_factor = AnalyticsService.GHG_FACTORS["grid"]
        
        # Source factor (direct emissions from renewable)
        source_factor = AnalyticsService.GHG_FACTORS.get(energy_source, 0)
        
        # CO2 avoided = grid_factor - source_factor (per kWh)
        co2_factor = grid_factor - source_factor
        co2_avoided = volume_kwh * co2_factor
        
        return CarbonImpactResponse(
            contract_id=contract_id,
            volume_kwh=volume_kwh,
            co2_avoided_kg=co2_avoided,
            co2_baseline_factor=grid_factor,
            energy_source=energy_source,
            calculated_at=datetime.utcnow()
        )
    
    @staticmethod
    async def get_monthly_analytics(
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> List[MonthlyAnalytics]:
        """Get monthly aggregated analytics."""
        contracts = list(_contracts_store.values())
        
        # Group by year-month
        monthly_data: Dict[str, Dict] = {}
        
        for contract in contracts:
            created_at = contract.get("created_at")
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            
            if year and created_at.year != year:
                continue
            if month and created_at.month != month:
                continue
            
            key = f"{created_at.year}-{created_at.month:02d}"
            
            if key not in monthly_data:
                monthly_data[key] = {
                    "year": created_at.year,
                    "month": created_at.month,
                    "total_kwh": 0,
                    "total_contracts": 0,
                    "total_value": 0,
                    "producers": set(),
                    "buyers": set()
                }
            
            data = monthly_data[key]
            data["total_kwh"] += contract.get("volume_kwh", 0)
            data["total_contracts"] += 1
            data["total_value"] += contract.get("volume_kwh", 0) * contract.get("price_per_kwh", 0)
            data["producers"].add(str(contract.get("producer_id")))
            data["buyers"].add(str(contract.get("buyer_id")))
        
        results = []
        for key, data in sorted(monthly_data.items()):
            co2_avoided = data["total_kwh"] * settings.CO2_BASELINE_FACTOR_KG_PER_KWH
            avg_price = data["total_value"] / data["total_kwh"] if data["total_kwh"] > 0 else 0
            
            results.append(MonthlyAnalytics(
                year=data["year"],
                month=data["month"],
                total_kwh_traded=data["total_kwh"],
                total_contracts=data["total_contracts"],
                total_co2_avoided_kg=co2_avoided,
                average_price_per_kwh=avg_price,
                unique_producers=len(data["producers"]),
                unique_buyers=len(data["buyers"])
            ))
        
        return results
    
    @staticmethod
    async def get_producer_performance(
        producer_id: Optional[str] = None,
        limit: int = 10
    ) -> List[ProducerPerformance]:
        """Get producer performance analytics."""
        contracts = list(_contracts_store.values())
        
        # Filter by producer if specified
        if producer_id:
            contracts = [c for c in contracts if str(c.get("producer_id")) == producer_id]
        
        # Group by producer
        producer_data: Dict[str, Dict] = {}
        
        for contract in contracts:
            pid = str(contract.get("producer_id"))
            
            if pid not in producer_data:
                producer_data[pid] = {
                    "producer_id": pid,
                    "total_kwh": 0,
                    "total_contracts": 0,
                    "total_revenue": 0,
                    "energy_sources": set()
                }
            
            data = producer_data[pid]
            data["total_kwh"] += contract.get("volume_kwh", 0)
            data["total_contracts"] += 1
            data["total_revenue"] += contract.get("volume_kwh", 0) * contract.get("price_per_kwh", 0)
            # Note: energy_source would come from producer profile, using default
            data["energy_sources"].add("solar")
        
        results = []
        for data in sorted(producer_data.values(), key=lambda x: x["total_kwh"], reverse=True)[:limit]:
            co2_avoided = data["total_kwh"] * settings.CO2_BASELINE_FACTOR_KG_PER_KWH
            
            results.append(ProducerPerformance(
                producer_id=data["producer_id"],
                total_kwh_sold=data["total_kwh"],
                total_contracts=data["total_contracts"],
                total_revenue=data["total_revenue"],
                average_rating=None,  # Would come from reviews
                co2_avoided_kg=co2_avoided,
                energy_sources=list(data["energy_sources"])
            ))
        
        return results
    
    @staticmethod
    async def get_dashboard_analytics() -> DashboardAnalytics:
        """Get dashboard analytics summary."""
        contracts = list(_contracts_store.values())
        
        total_kwh = sum(c.get("volume_kwh", 0) for c in contracts)
        total_co2 = total_kwh * settings.CO2_BASELINE_FACTOR_KG_PER_KWH
        total_value = sum(
            c.get("volume_kwh", 0) * c.get("price_per_kwh", 0)
            for c in contracts
        )
        avg_price = total_value / total_kwh if total_kwh > 0 else 0
        
        producers = set(str(c.get("producer_id")) for c in contracts)
        buyers = set(str(c.get("buyer_id")) for c in contracts)
        
        monthly = await AnalyticsService.get_monthly_analytics()
        top_producers = await AnalyticsService.get_producer_performance(limit=5)
        
        return DashboardAnalytics(
            total_kwh_traded=total_kwh,
            total_co2_avoided_kg=total_co2,
            total_contracts=len(contracts),
            active_producers=len(producers),
            active_buyers=len(buyers),
            average_price_per_kwh=avg_price,
            monthly_trends=monthly[-12:],  # Last 12 months
            top_producers=top_producers,
            last_updated=datetime.utcnow()
        )
    
    @staticmethod
    async def generate_carbon_report(
        producer_id: Optional[str] = None,
        buyer_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        energy_source: Optional[str] = None
    ) -> CarbonReportResponse:
        """Generate detailed carbon report."""
        contracts = list(_contracts_store.values())
        certificates = list(_certificates_store.values())
        
        # Apply filters
        if producer_id:
            contracts = [c for c in contracts if str(c.get("producer_id")) == producer_id]
        if buyer_id:
            contracts = [c for c in contracts if str(c.get("buyer_id")) == buyer_id]
        
        if start_date:
            contracts = [
                c for c in contracts
                if c.get("created_at", datetime.min) >= start_date
            ]
        if end_date:
            contracts = [
                c for c in contracts
                if c.get("created_at", datetime.max) <= end_date
            ]
        
        # Calculate totals
        total_kwh = sum(c.get("volume_kwh", 0) for c in contracts)
        total_co2 = total_kwh * settings.CO2_BASELINE_FACTOR_KG_PER_KWH
        
        # Breakdown by source (mock data since we don't have source in contracts)
        sources = {"solar": 0.6, "wind": 0.3, "hydro": 0.1}
        breakdown_by_source = {
            source: total_kwh * ratio
            for source, ratio in sources.items()
        }
        
        # Breakdown by month
        monthly_breakdown = []
        for contract in contracts:
            created_at = contract.get("created_at")
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            month_key = f"{created_at.year}-{created_at.month:02d}"
            monthly_breakdown.append({
                "month": month_key,
                "kwh": contract.get("volume_kwh", 0),
                "co2_avoided_kg": contract.get("volume_kwh", 0) * settings.CO2_BASELINE_FACTOR_KG_PER_KWH
            })
        
        period_start = start_date or datetime.utcnow() - timedelta(days=365)
        period_end = end_date or datetime.utcnow()
        
        return CarbonReportResponse(
            report_id=f"RPT-{uuid.uuid4().hex[:12].upper()}",
            period_start=period_start,
            period_end=period_end,
            total_kwh=total_kwh,
            total_co2_avoided_kg=total_co2,
            co2_in_tonnes=total_co2 / 1000,
            breakdown_by_source=breakdown_by_source,
            breakdown_by_month=monthly_breakdown,
            generated_at=datetime.utcnow()
        )
    
    @staticmethod
    async def get_ghg_baseline_factors(region: str = "india") -> GHGBaselineFactors:
        """Get GHG baseline emission factors."""
        return GHGBaselineFactors(
            region=region,
            grid_emission_factor=AnalyticsService.GHG_FACTORS["grid"],
            solar_factor=AnalyticsService.GHG_FACTORS["solar"],
            wind_factor=AnalyticsService.GHG_FACTORS["wind"],
            hydro_factor=AnalyticsService.GHG_FACTORS["hydro"],
            biomass_factor=AnalyticsService.GHG_FACTORS["biomass"],
            last_updated=datetime.utcnow()
        )


analytics_service = AnalyticsService()
