"""
Verdant Backend – Neo4j Graph API Routes
========================================
REST API endpoints for graph-based features:
- Recommendations
- Analytics
- Graph sync and health
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends

from app.core.auth import _get_current_user as get_current_user
from app.core.logging import get_logger
from app.models.users import User
from app.services import neo4j_service

try:
    from neo4j.exceptions import ServiceUnavailable, SessionExpired
except ImportError:
    ServiceUnavailable = Exception
    SessionExpired = Exception

logger = get_logger("routes.neo4j")

router = APIRouter(prefix="/graph", tags=["Graph Database"])


# ══════════════════════════════════════════════════════════════
# HEALTH & STATUS
# ══════════════════════════════════════════════════════════════

_UNAVAILABLE_STATS = {
    "total_users": 0, "total_producers": 0, "total_listings": 0,
    "total_contracts": 0, "total_relationships": 0,
}


@router.get("/health")
async def neo4j_health():
    """Check Neo4j connection health and get graph statistics."""
    try:
        return await neo4j_service.health_check()
    except Exception as e:
        logger.error("Neo4j health check failed: %s", e)
        return {"status": "unavailable", "error": str(e)}


@router.get("/stats")
async def graph_stats():
    """Get detailed graph statistics."""
    if not neo4j_service.is_available():
        return {"status": "unavailable", "stats": _UNAVAILABLE_STATS}
    try:
        stats = await neo4j_service.get_graph_stats()
        return {"status": "ok", "stats": stats}
    except Exception as e:
        logger.error("Failed to get graph stats: %s", e)
        return {"status": "unavailable", "stats": _UNAVAILABLE_STATS}


# ══════════════════════════════════════════════════════════════
# RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════

@router.get("/recommendations/producers")
async def recommend_producers(
    limit: int = 10,
    energy_source: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Get personalized producer recommendations for the current user.
    
    Based on:
    - Similar users' trading patterns
    - Energy source preferences
    - Producer ratings and activity
    """
    if not neo4j_service.is_available():
        return {"user_id": str(current_user.id), "recommendations": [], "count": 0}
    try:
        recommendations = await neo4j_service.recommend_producers_for_user(
            user_id=str(current_user.id),
            limit=limit,
            energy_source_filter=energy_source,
        )
        return {
            "user_id": str(current_user.id),
            "recommendations": recommendations,
            "count": len(recommendations),
        }
    except Exception as e:
        logger.error("Failed to get producer recommendations: %s", e)
        return {"user_id": str(current_user.id), "recommendations": [], "count": 0}


@router.get("/recommendations/listings/{listing_id}")
async def similar_listings(
    listing_id: str,
    limit: int = 5,
):
    """Get similar energy listings based on graph relationships."""
    if not neo4j_service.is_available():
        return {"listing_id": listing_id, "similar_listings": [], "count": 0}
    try:
        similar = await neo4j_service.recommend_similar_listings(
            listing_id=listing_id,
            limit=limit,
        )
        return {
            "listing_id": listing_id,
            "similar_listings": similar,
            "count": len(similar),
        }
    except Exception as e:
        logger.error("Failed to get similar listings: %s", e)
        return {"listing_id": listing_id, "similar_listings": [], "count": 0}


@router.get("/recommendations/similar-users")
async def similar_users(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
):
    """Find users with similar trading patterns."""
    if not neo4j_service.is_available():
        return {"user_id": str(current_user.id), "similar_users": [], "count": 0}
    try:
        similar = await neo4j_service.get_users_who_bought_similar(
            user_id=str(current_user.id),
            limit=limit,
        )
        return {
            "user_id": str(current_user.id),
            "similar_users": similar,
            "count": len(similar),
        }
    except Exception as e:
        logger.error("Failed to get similar users: %s", e)
        return {"user_id": str(current_user.id), "similar_users": [], "count": 0}


# ══════════════════════════════════════════════════════════════
# ANALYTICS
# ══════════════════════════════════════════════════════════════

@router.get("/analytics/energy-flow")
async def energy_flow_analytics():
    """Get overall energy trading flow analytics."""
    if not neo4j_service.is_available():
        return {
            "total_energy_traded_kwh": 0, "total_transactions": 0,
            "top_energy_sources": [], "active_trade_routes": 0,
            "avg_contract_size_kwh": 0,
        }
    try:
        analytics = await neo4j_service.get_energy_flow_analytics()
        return analytics
    except Exception as e:
        logger.error("Failed to get energy flow analytics: %s", e)
        return {
            "total_energy_traded_kwh": 0, "total_transactions": 0,
            "top_energy_sources": [], "active_trade_routes": 0,
            "avg_contract_size_kwh": 0,
        }


@router.get("/analytics/producer-rankings")
async def producer_rankings(
    energy_source: Optional[str] = None,
    limit: int = 10,
):
    """Get ranked list of top producers."""
    if not neo4j_service.is_available():
        return {"rankings": [], "count": 0}
    try:
        rankings = await neo4j_service.get_producer_rankings(
            energy_source=energy_source,
            limit=limit,
        )
        return {"rankings": rankings, "count": len(rankings)}
    except Exception as e:
        logger.error("Failed to get producer rankings: %s", e)
        return {"rankings": [], "count": 0}


@router.get("/analytics/user-graph")
async def user_trading_graph(
    current_user: User = Depends(get_current_user),
):
    """
    Get the complete trading graph for the current user.
    
    Returns all connected producers, listings, and contracts.
    """
    if not neo4j_service.is_available():
        return {
            "user_id": str(current_user.id),
            "owned_producers": [], "traded_producers": [], "contracts": [],
        }
    try:
        graph = await neo4j_service.get_user_trading_graph(
            user_id=str(current_user.id)
        )
        return graph
    except Exception as e:
        logger.error("Failed to get user trading graph: %s", e)
        return {
            "user_id": str(current_user.id),
            "owned_producers": [], "traded_producers": [], "contracts": [],
        }


@router.get("/analytics/path/{producer_id}")
async def find_connection_path(
    producer_id: str,
    max_hops: int = 4,
    current_user: User = Depends(get_current_user),
):
    """
    Find the relationship path between current user and a producer.
    
    Useful for understanding trust chains and connections.
    """
    if not neo4j_service.is_available():
        return {
            "from_user": str(current_user.id), "to_producer": producer_id,
            "path_exists": False, "hops": 0, "path": [],
        }
    try:
        path = await neo4j_service.find_energy_path(
            from_user_id=str(current_user.id),
            to_producer_id=producer_id,
            max_hops=max_hops,
        )
        return {"from_user": str(current_user.id), "to_producer": producer_id, **path}
    except Exception as e:
        logger.error("Failed to find path: %s", e)
        return {
            "from_user": str(current_user.id), "to_producer": producer_id,
            "path_exists": False, "hops": 0, "path": [],
        }


# ══════════════════════════════════════════════════════════════
# SYNC OPERATIONS (Admin only)
# ══════════════════════════════════════════════════════════════

@router.post("/sync/full")
async def full_sync(
    current_user: User = Depends(get_current_user),
):
    """
    Perform full sync from MongoDB to Neo4j.
    
    Admin only - syncs all users, producers, listings, and contracts.
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        result = await neo4j_service.full_sync_from_mongodb()
        return {
            "status": "success",
            "synced": result,
        }
    except Exception as e:
        logger.error("Full sync failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/sync/user/{user_id}")
async def sync_single_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    """Sync a single user to Neo4j."""
    if current_user.role.value != "admin" and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only sync your own user or admin required"
        )
    
    try:
        from app.models.users import User as UserModel
        from beanie import PydanticObjectId
        
        user = await UserModel.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        result = await neo4j_service.sync_user_to_neo4j(user.model_dump())
        return {"status": "success", "synced": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("User sync failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ══════════════════════════════════════════════════════════════
# CYPHER QUERY (For Graph Explorer)
# ══════════════════════════════════════════════════════════════

from pydantic import BaseModel

class CypherQueryRequest(BaseModel):
    query: str
    params: dict = {}


@router.post("/query")
async def run_cypher_query(
    request: CypherQueryRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Execute a custom Cypher query and return results.
    
    For security, only read queries (starting with MATCH, RETURN, etc.) are allowed.
    Admin users can run any query.
    """
    query = request.query.strip()
    
    # Security: Only allow read queries for non-admin users
    read_keywords = ["MATCH", "RETURN", "OPTIONAL MATCH", "WITH", "UNWIND", "CALL"]
    write_keywords = ["CREATE", "MERGE", "DELETE", "SET", "REMOVE", "DETACH"]
    
    first_word = query.split()[0].upper() if query else ""
    
    if current_user.role.value != "admin":
        if any(kw in query.upper() for kw in write_keywords):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Write operations require admin access"
            )
    
    if not neo4j_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is currently unavailable. The instance may be paused."
        )
    try:
        result = await neo4j_service.run_custom_query(
            query=query,
            params=request.params,
        )
        return {
            "status": "success",
            "query": query,
            "nodes": result.get("nodes", []),
            "edges": result.get("edges", []),
            "records": result.get("records", []),
            "count": result.get("count", 0),
        }
    except (ServiceUnavailable, SessionExpired, RuntimeError, OSError) as e:
        logger.error("Neo4j connection error during query: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is currently unavailable. The instance may be paused or restarting."
        )
    except Exception as e:
        logger.error("Cypher query failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query error: {str(e)}"
        )


@router.get("/sample-queries")
async def get_sample_queries():
    """Get a list of sample Cypher queries for the Graph Explorer."""
    return {
        "queries": [
            {
                "name": "All Nodes Overview",
                "description": "Get all nodes with their labels",
                "query": "MATCH (n) RETURN n LIMIT 50"
            },
            {
                "name": "Users & Their Purchases",
                "description": "Show users and what they bought",
                "query": "MATCH (u:User)-[r:PURCHASED]->(l:Listing) RETURN u, r, l LIMIT 30"
            },
            {
                "name": "Energy Trading Network",
                "description": "Full trading network visualization",
                "query": "MATCH (u:User)-[r]->(p:Producer)-[o:OFFERS]->(l:Listing) RETURN u, r, p, o, l LIMIT 50"
            },
            {
                "name": "Producer Rankings",
                "description": "Top producers by contract count",
                "query": "MATCH (p:Producer)<-[:PURCHASED]-(u:User) WITH p, count(u) as buyers RETURN p, buyers ORDER BY buyers DESC LIMIT 10"
            },
            {
                "name": "Contract Flow",
                "description": "Contracts and their connections",
                "query": "MATCH (c:Contract)-[r]-(n) RETURN c, r, n LIMIT 40"
            },
            {
                "name": "Solar Energy Network",
                "description": "All solar energy producers and listings",
                "query": "MATCH (p:Producer {energy_type: 'solar'})-[:OFFERS]->(l:Listing) RETURN p, l"
            },
            {
                "name": "User Graph (Your Trading)",
                "description": "Current user's complete trading graph",
                "query": "MATCH (u:User {id: $user_id})-[r]->(n) RETURN u, r, n"
            },
            {
                "name": "Connection Paths",
                "description": "Find paths between users",
                "query": "MATCH path = shortestPath((u1:User)-[*..4]-(u2:User)) WHERE u1.id <> u2.id RETURN path LIMIT 10"
            },
            {
                "name": "Biomass & Geothermal Network",
                "description": "Biomass and geothermal producers and their energy listings",
                "query": "MATCH (p:Producer)-[r:OFFERS]->(l:EnergyListing) WHERE p.energy_type IN ['biomass', 'geothermal'] RETURN p, r, l"
            },
            {
                "name": "Transaction Network",
                "description": "Energy purchase transactions linked to contracts",
                "query": "MATCH (u:User)-[r1:MADE_TRANSACTION]->(t:Transaction)-[r2:FOR_CONTRACT]->(c:Contract) RETURN u, r1, t, r2, c LIMIT 40"
            },
            {
                "name": "Certificate Flow",
                "description": "Green certificates issued by producers and owned by users",
                "query": "MATCH (u:User)-[r1:OWNS_CERTIFICATE]->(c:Certificate)<-[r2:ISSUED]-(p:Producer) RETURN u, r1, c, r2, p LIMIT 30"
            },
            {
                "name": "Similar Users Network",
                "description": "Users with similar energy trading patterns",
                "query": "MATCH (u1:User)-[r:SIMILAR_TO]-(u2:User) RETURN u1, r, u2 LIMIT 40"
            },
        ]
    }

