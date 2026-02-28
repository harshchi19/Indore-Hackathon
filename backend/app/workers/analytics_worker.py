"""
Analytics Worker

Handles background computation of analytics and reports.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import asyncio

from app.services.analytics_service import AnalyticsService
from app.services.contract_service import _contracts_store
from app.services.certificate_service import _certificates_store


class AnalyticsWorker:
    """Worker for background analytics computation."""
    
    # Cache for computed analytics
    _analytics_cache: Dict[str, Any] = {}
    _cache_ttl = timedelta(minutes=5)
    
    @staticmethod
    async def compute_and_cache_dashboard() -> Dict[str, Any]:
        """
        Compute dashboard analytics and cache results.
        """
        dashboard = await AnalyticsService.get_dashboard_analytics()
        
        AnalyticsWorker._analytics_cache["dashboard"] = {
            "data": dashboard,
            "computed_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + AnalyticsWorker._cache_ttl
        }
        
        return {
            "status": "cached",
            "computed_at": datetime.utcnow(),
            "expires_at": AnalyticsWorker._analytics_cache["dashboard"]["expires_at"]
        }
    
    @staticmethod
    async def get_cached_dashboard() -> Optional[Dict[str, Any]]:
        """Get cached dashboard if valid."""
        cached = AnalyticsWorker._analytics_cache.get("dashboard")
        if cached and cached["expires_at"] > datetime.utcnow():
            return cached["data"]
        return None
    
    @staticmethod
    async def compute_monthly_aggregations(
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Compute and store monthly aggregations.
        Simulates MongoDB $group aggregation.
        """
        monthly = await AnalyticsService.get_monthly_analytics(year, month)
        
        cache_key = f"monthly_{year or 'all'}_{month or 'all'}"
        AnalyticsWorker._analytics_cache[cache_key] = {
            "data": monthly,
            "computed_at": datetime.utcnow()
        }
        
        return {
            "status": "computed",
            "periods": len(monthly),
            "cache_key": cache_key
        }
    
    @staticmethod
    async def compute_producer_rankings() -> Dict[str, Any]:
        """
        Compute producer performance rankings.
        """
        rankings = await AnalyticsService.get_producer_performance(limit=100)
        
        AnalyticsWorker._analytics_cache["producer_rankings"] = {
            "data": rankings,
            "computed_at": datetime.utcnow()
        }
        
        return {
            "status": "computed",
            "producers_ranked": len(rankings),
            "top_producer": rankings[0].producer_id if rankings else None
        }
    
    @staticmethod
    async def generate_daily_summary() -> Dict[str, Any]:
        """
        Generate daily summary report.
        Would typically run as a scheduled job.
        """
        today = datetime.utcnow().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        
        # Filter today's contracts
        todays_contracts = [
            c for c in _contracts_store.values()
            if start_of_day <= c.get("created_at", datetime.min) <= end_of_day
        ]
        
        # Calculate metrics
        total_kwh = sum(c.get("volume_kwh", 0) for c in todays_contracts)
        total_value = sum(
            c.get("volume_kwh", 0) * c.get("price_per_kwh", 0)
            for c in todays_contracts
        )
        
        summary = {
            "date": today.isoformat(),
            "new_contracts": len(todays_contracts),
            "total_kwh_traded": total_kwh,
            "total_value": total_value,
            "co2_avoided_kg": total_kwh * 0.4,  # Using default factor
            "generated_at": datetime.utcnow()
        }
        
        AnalyticsWorker._analytics_cache["daily_summary"] = summary
        
        return summary
    
    @staticmethod
    async def cleanup_old_cache() -> Dict[str, Any]:
        """Clean up expired cache entries."""
        now = datetime.utcnow()
        removed = []
        
        for key in list(AnalyticsWorker._analytics_cache.keys()):
            entry = AnalyticsWorker._analytics_cache[key]
            if isinstance(entry, dict) and entry.get("expires_at"):
                if entry["expires_at"] < now:
                    del AnalyticsWorker._analytics_cache[key]
                    removed.append(key)
        
        return {
            "removed_entries": len(removed),
            "removed_keys": removed
        }
    
    @staticmethod
    def get_cache_status() -> Dict[str, Any]:
        """Get current cache status."""
        entries = []
        for key, value in AnalyticsWorker._analytics_cache.items():
            entry_info = {"key": key}
            if isinstance(value, dict):
                entry_info["computed_at"] = value.get("computed_at")
                entry_info["expires_at"] = value.get("expires_at")
            entries.append(entry_info)
        
        return {
            "total_entries": len(AnalyticsWorker._analytics_cache),
            "entries": entries
        }


analytics_worker = AnalyticsWorker()
