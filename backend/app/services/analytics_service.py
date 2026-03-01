"""
Verdant Backend – Carbon Analytics service (Part B)
CO₂ avoidance computation and MongoDB aggregation-based analytics.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from beanie import PydanticObjectId

from app.core.logging import get_logger
from app.db.base import EnergySource
from app.db.session import get_db
from app.models.contracts import Contract, ContractStatus

logger = get_logger("services.analytics")

# ── GHG baseline emission factors (kg CO₂ / kWh) ───────────
# Based on grid-average displaced by renewable source
GHG_BASELINE_FACTORS: Dict[str, float] = {
    EnergySource.SOLAR.value: 0.45,
    EnergySource.WIND.value: 0.48,
    EnergySource.HYDRO.value: 0.50,
    EnergySource.BIOMASS.value: 0.30,
    EnergySource.GEOTHERMAL.value: 0.42,
}

DEFAULT_FACTOR = 0.45  # fallback


async def compute_co2_avoided(contract_id: str) -> dict:
    """Compute CO₂ avoided (kg) for a single settled contract."""
    contract = await Contract.get(PydanticObjectId(contract_id))
    if contract is None:
        return {"error": "Contract not found"}

    # Try to determine energy source from linked listing or default
    energy_source_value = await _resolve_energy_source(contract)
    factor = GHG_BASELINE_FACTORS.get(energy_source_value, DEFAULT_FACTOR)
    co2_kg = round(contract.volume_kwh * factor, 4)

    return {
        "contract_id": str(contract.id),
        "volume_kwh": contract.volume_kwh,
        "energy_source": energy_source_value,
        "baseline_factor_kg_per_kwh": factor,
        "co2_avoided_kg": co2_kg,
        "co2_avoided_tonnes": round(co2_kg / 1000, 6),
    }


async def _resolve_energy_source(contract: Contract) -> str:
    """Resolve the energy source from the linked listing, or default to solar."""
    if contract.listing_id:
        from app.models.energy import EnergyListing

        listing = await EnergyListing.get(contract.listing_id)
        if listing:
            return listing.energy_source.value
    return EnergySource.SOLAR.value


async def monthly_aggregation(
    year: int,
    month: Optional[int] = None,
    producer_id: Optional[str] = None,
) -> list[dict]:
    """
    MongoDB aggregation pipeline for monthly carbon analytics.
    Returns total kWh traded and CO₂ avoided per month.
    """
    db = get_db()
    collection = db["contracts"]

    match_stage: dict = {"status": ContractStatus.SETTLED.value}
    if producer_id:
        match_stage["producer_id"] = PydanticObjectId(producer_id)

    # Date filter
    if month:
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
        match_stage["created_at"] = {"$gte": start, "$lt": end}
    else:
        start = datetime(year, 1, 1, tzinfo=timezone.utc)
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        match_stage["created_at"] = {"$gte": start, "$lt": end}

    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"},
                },
                "total_volume_kwh": {"$sum": "$volume_kwh"},
                "total_amount": {"$sum": "$total_amount"},
                "contract_count": {"$sum": 1},
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]

    results = []
    async for doc in collection.aggregate(pipeline):
        vol = doc["total_volume_kwh"]
        co2_kg = round(vol * DEFAULT_FACTOR, 4)
        results.append(
            {
                "year": doc["_id"]["year"],
                "month": doc["_id"]["month"],
                "total_kwh": round(vol, 4),
                "contracts_count": doc["contract_count"],
                "co2_avoided_kg": co2_kg,
            }
        )

    return results


async def dashboard_summary(producer_id: Optional[str] = None) -> dict:
    """
    High-level dashboard stats matching the frontend AnalyticsDashboard type.
    Returns: total_energy_kwh, total_co2_avoided_kg, total_contracts,
             total_certificates, energy_by_source, monthly_trend.
    """
    db = get_db()
    contracts_coll = db["contracts"]
    certs_coll = db["certificates"]

    match_stage: dict = {"status": ContractStatus.SETTLED.value}
    if producer_id:
        match_stage["producer_id"] = PydanticObjectId(producer_id)

    # ── Total volume / contract count ─────────────────────────────────────
    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": None,
                "total_volume_kwh": {"$sum": "$volume_kwh"},
                "total_amount": {"$sum": "$total_amount"},
                "contract_count": {"$sum": 1},
            }
        },
    ]

    result = None
    async for doc in contracts_coll.aggregate(pipeline):
        result = doc

    # ── Energy-by-source via lookup to energy_listings ────────────────────
    source_pipeline = [
        {"$match": match_stage},
        {
            "$lookup": {
                "from": "energy_listings",
                "localField": "listing_id",
                "foreignField": "_id",
                "as": "listing",
            }
        },
        {
            "$addFields": {
                "energy_source": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$listing.energy_source", 0]},
                        "solar",
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": "$energy_source",
                "total_kwh": {"$sum": "$volume_kwh"},
            }
        },
    ]

    energy_by_source: Dict[str, float] = {}
    async for doc in contracts_coll.aggregate(source_pipeline):
        energy_by_source[str(doc["_id"])] = round(doc["total_kwh"], 4)

    # ── Certificate count ─────────────────────────────────────────────────
    total_certs = await certs_coll.count_documents({})

    # ── Monthly trend for current year ────────────────────────────────────
    current_year = datetime.now(timezone.utc).year
    monthly = await monthly_aggregation(current_year, producer_id=producer_id)

    if result is None:
        return {
            "total_energy_kwh": 0,
            "total_co2_avoided_kg": 0,
            "total_contracts": 0,
            "total_certificates": total_certs,
            "energy_by_source": energy_by_source,
            "monthly_trend": monthly,
        }

    vol = result["total_volume_kwh"]
    co2_kg = round(vol * DEFAULT_FACTOR, 4)

    return {
        "total_energy_kwh": round(vol, 4),
        "total_co2_avoided_kg": co2_kg,
        "total_contracts": result["contract_count"],
        "total_certificates": total_certs,
        "energy_by_source": energy_by_source,
        "monthly_trend": monthly,
    }


async def producer_performance(top_n: int = 10) -> list[dict]:
    """Rank producers by total kWh settled, including company name via lookup."""
    db = get_db()
    collection = db["contracts"]

    pipeline = [
        {"$match": {"status": ContractStatus.SETTLED.value}},
        {
            "$group": {
                "_id": "$producer_id",
                "total_volume_kwh": {"$sum": "$volume_kwh"},
                "total_amount": {"$sum": "$total_amount"},
                "contract_count": {"$sum": 1},
            }
        },
        {"$sort": {"total_volume_kwh": -1}},
        {"$limit": top_n},
        {
            "$lookup": {
                "from": "producers",
                "localField": "_id",
                "foreignField": "_id",
                "as": "producer",
            }
        },
    ]

    results = []
    async for doc in collection.aggregate(pipeline):
        vol = doc["total_volume_kwh"]
        producer_doc = doc["producer"][0] if doc.get("producer") else {}
        results.append(
            {
                "producer_id": str(doc["_id"]),
                "company_name": producer_doc.get(
                    "company_name", f"Producer {str(doc['_id'])[-4:]}"
                ),
                "total_kwh": round(vol, 4),
                "co2_avoided_kg": round(vol * DEFAULT_FACTOR, 4),
                "contracts_count": doc["contract_count"],
            }
        )

    return results
