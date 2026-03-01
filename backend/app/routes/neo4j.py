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

logger = get_logger("routes.neo4j")

router = APIRouter(prefix="/graph", tags=["Graph Database"])


# ══════════════════════════════════════════════════════════════
# HEALTH & STATUS
# ══════════════════════════════════════════════════════════════

@router.get("/health")
async def neo4j_health():
    """Check Neo4j connection health and get graph statistics."""
    try:
        health = await neo4j_service.health_check()
        return health
    except Exception as e:
        logger.error("Neo4j health check failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Neo4j unavailable: {str(e)}"
        )


@router.get("/stats")
async def graph_stats():
    """Get detailed graph statistics."""
    try:
        stats = await neo4j_service.get_graph_stats()
        return {"status": "ok", "stats": stats}
    except Exception as e:
        logger.error("Failed to get graph stats: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/recommendations/listings/{listing_id}")
async def similar_listings(
    listing_id: str,
    limit: int = 5,
):
    """Get similar energy listings based on graph relationships."""
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/recommendations/similar-users")
async def similar_users(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
):
    """Find users with similar trading patterns."""
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ══════════════════════════════════════════════════════════════
# ANALYTICS
# ══════════════════════════════════════════════════════════════

@router.get("/analytics/energy-flow")
async def energy_flow_analytics():
    """Get overall energy trading flow analytics."""
    try:
        analytics = await neo4j_service.get_energy_flow_analytics()
        return analytics
    except Exception as e:
        logger.error("Failed to get energy flow analytics: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/analytics/producer-rankings")
async def producer_rankings(
    energy_source: Optional[str] = None,
    limit: int = 10,
):
    """Get ranked list of top producers."""
    try:
        rankings = await neo4j_service.get_producer_rankings(
            energy_source=energy_source,
            limit=limit,
        )
        return {
            "rankings": rankings,
            "count": len(rankings),
        }
    except Exception as e:
        logger.error("Failed to get producer rankings: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/analytics/user-graph")
async def user_trading_graph(
    current_user: User = Depends(get_current_user),
):
    """
    Get the complete trading graph for the current user.
    
    Returns all connected producers, listings, and contracts.
    """
    try:
        graph = await neo4j_service.get_user_trading_graph(
            user_id=str(current_user.id)
        )
        return graph
    except Exception as e:
        logger.error("Failed to get user trading graph: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


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
    try:
        path = await neo4j_service.find_energy_path(
            from_user_id=str(current_user.id),
            to_producer_id=producer_id,
            max_hops=max_hops,
        )
        return {
            "from_user": str(current_user.id),
            "to_producer": producer_id,
            **path,
        }
    except Exception as e:
        logger.error("Failed to find path: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


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
