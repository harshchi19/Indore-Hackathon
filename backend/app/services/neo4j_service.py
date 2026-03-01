"""
Verdant Backend – Neo4j Graph Database Service
===============================================
Graph-based relationships, recommendations, and analytics for energy trading.

Features:
- User ↔ Producer ↔ EnergyListing ↔ Contract graph relationships
- Graph-based producer recommendations for users
- Energy flow pattern analysis
- Community detection for similar producers/consumers
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager

from neo4j import AsyncGraphDatabase, AsyncDriver, AsyncSession
from neo4j.exceptions import ServiceUnavailable, AuthError

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("services.neo4j")
settings = get_settings()

# ── Configuration ──────────────────────────────────────────────
# Neo4j Aura Connection (from settings/environment)
NEO4J_URI = settings.NEO4J_URI
NEO4J_USERNAME = settings.NEO4J_USERNAME
NEO4J_PASSWORD = settings.NEO4J_PASSWORD
NEO4J_DATABASE = getattr(settings, 'NEO4J_DATABASE', 'neo4j')


# ── Global Driver Instance ─────────────────────────────────────
_driver: AsyncDriver | None = None


async def init_neo4j() -> AsyncDriver:
    """
    Initialize Neo4j async driver connection.
    Call once at application startup.
    """
    global _driver
    
    try:
        _driver = AsyncGraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
            database=NEO4J_DATABASE,
            max_connection_lifetime=3600,
            max_connection_pool_size=50,
            connection_acquisition_timeout=60,
        )
        
        # Verify connectivity
        await _driver.verify_connectivity()
        logger.info("✅ Connected to Neo4j: %s", NEO4J_URI)
        
        # Create constraints and indexes
        await _create_constraints_and_indexes()
        
        return _driver
        
    except AuthError as e:
        logger.error("❌ Neo4j authentication failed: %s", e)
        raise
    except ServiceUnavailable as e:
        logger.error("❌ Neo4j service unavailable: %s", e)
        raise
    except Exception as e:
        logger.error("❌ Neo4j connection failed: %s", e)
        raise


async def close_neo4j():
    """Close Neo4j driver connection. Call at application shutdown."""
    global _driver
    if _driver:
        await _driver.close()
        _driver = None
        logger.info("🔌 Neo4j connection closed")


def get_driver() -> AsyncDriver:
    """Get the current Neo4j driver instance."""
    if _driver is None:
        raise RuntimeError("Neo4j driver not initialized. Call init_neo4j() first.")
    return _driver


def is_available() -> bool:
    """Return True if the Neo4j driver is initialised and ready."""
    return _driver is not None


@asynccontextmanager
async def get_session():
    """Context manager for Neo4j session."""
    driver = get_driver()
    session = driver.session(database=NEO4J_DATABASE)
    try:
        yield session
    finally:
        await session.close()


# ── Schema Setup ───────────────────────────────────────────────
async def _create_constraints_and_indexes():
    """Create unique constraints and indexes for optimal performance."""
    async with get_session() as session:
        constraints = [
            # Unique constraints
            "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE",
            "CREATE CONSTRAINT producer_id IF NOT EXISTS FOR (p:Producer) REQUIRE p.producer_id IS UNIQUE",
            "CREATE CONSTRAINT listing_id IF NOT EXISTS FOR (l:Listing) REQUIRE l.listing_id IS UNIQUE",
            "CREATE CONSTRAINT contract_id IF NOT EXISTS FOR (c:Contract) REQUIRE c.contract_id IS UNIQUE",
            
            # Indexes for faster lookups
            "CREATE INDEX user_email IF NOT EXISTS FOR (u:User) ON (u.email)",
            "CREATE INDEX producer_status IF NOT EXISTS FOR (p:Producer) ON (p.status)",
            "CREATE INDEX listing_energy_source IF NOT EXISTS FOR (l:Listing) ON (l.energy_source)",
            "CREATE INDEX listing_status IF NOT EXISTS FOR (l:Listing) ON (l.status)",
            "CREATE INDEX contract_status IF NOT EXISTS FOR (c:Contract) ON (c.status)",
        ]
        
        for constraint in constraints:
            try:
                await session.run(constraint)
            except Exception as e:
                # Constraint might already exist
                logger.debug("Constraint/Index: %s", str(e)[:100])
        
        logger.info("✅ Neo4j constraints and indexes created")


# ══════════════════════════════════════════════════════════════
# NODE OPERATIONS (CRUD)
# ══════════════════════════════════════════════════════════════

async def create_user_node(
    user_id: str,
    email: str,
    full_name: str,
    role: str = "consumer",
    is_active: bool = True,
) -> Dict[str, Any]:
    """
    Create or update a User node in the graph.
    
    Args:
        user_id: MongoDB ObjectId as string
        email: User email
        full_name: User's full name
        role: User role (consumer/producer/admin)
        is_active: Whether user account is active
        
    Returns:
        Dict with created user node properties
    """
    query = """
    MERGE (u:User {user_id: $user_id})
    SET u.email = $email,
        u.full_name = $full_name,
        u.role = $role,
        u.is_active = $is_active,
        u.updated_at = datetime()
    ON CREATE SET u.created_at = datetime()
    RETURN u
    """
    
    async with get_session() as session:
        result = await session.run(
            query,
            user_id=user_id,
            email=email,
            full_name=full_name,
            role=role,
            is_active=is_active,
        )
        record = await result.single()
        node = record["u"]
        logger.info("✅ User node created/updated: %s", email)
        return dict(node)


async def create_producer_node(
    producer_id: str,
    owner_id: str,
    company_name: str,
    energy_sources: List[str],
    capacity_kw: float,
    location: str,
    status: str = "pending",
    description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create or update a Producer node and link to owner User.
    
    Args:
        producer_id: MongoDB ObjectId as string
        owner_id: Owner User's MongoDB ObjectId
        company_name: Producer company name
        energy_sources: List of energy sources (solar, wind, etc.)
        capacity_kw: Installed capacity in kW
        location: Producer location
        status: Verification status
        description: Optional description
        
    Returns:
        Dict with created producer node properties
    """
    query = """
    MERGE (p:Producer {producer_id: $producer_id})
    SET p.company_name = $company_name,
        p.energy_sources = $energy_sources,
        p.capacity_kw = $capacity_kw,
        p.location = $location,
        p.status = $status,
        p.description = $description,
        p.updated_at = datetime()
    ON CREATE SET p.created_at = datetime()
    
    WITH p
    MATCH (u:User {user_id: $owner_id})
    MERGE (u)-[:OWNS]->(p)
    
    RETURN p
    """
    
    async with get_session() as session:
        result = await session.run(
            query,
            producer_id=producer_id,
            owner_id=owner_id,
            company_name=company_name,
            energy_sources=energy_sources,
            capacity_kw=capacity_kw,
            location=location,
            status=status,
            description=description,
        )
        record = await result.single()
        if record:
            node = record["p"]
            logger.info("✅ Producer node created/updated: %s", company_name)
            return dict(node)
        return {}


async def create_listing_node(
    listing_id: str,
    producer_id: str,
    owner_id: str,
    title: str,
    energy_source: str,
    quantity_kwh: float,
    price_per_kwh: float,
    status: str = "active",
    description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create or update an Energy Listing node with relationships.
    
    Relationships created:
    - (Producer)-[:LISTED]->(Listing)
    - (User)-[:CREATED]->(Listing)
    """
    query = """
    MERGE (l:Listing {listing_id: $listing_id})
    SET l.title = $title,
        l.energy_source = $energy_source,
        l.quantity_kwh = $quantity_kwh,
        l.price_per_kwh = $price_per_kwh,
        l.status = $status,
        l.description = $description,
        l.updated_at = datetime()
    ON CREATE SET l.created_at = datetime()
    
    WITH l
    OPTIONAL MATCH (p:Producer {producer_id: $producer_id})
    FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END |
        MERGE (p)-[:LISTED]->(l)
    )
    
    WITH l
    OPTIONAL MATCH (u:User {user_id: $owner_id})
    FOREACH (_ IN CASE WHEN u IS NOT NULL THEN [1] ELSE [] END |
        MERGE (u)-[:CREATED]->(l)
    )
    
    RETURN l
    """
    
    async with get_session() as session:
        result = await session.run(
            query,
            listing_id=listing_id,
            producer_id=producer_id,
            owner_id=owner_id,
            title=title,
            energy_source=energy_source,
            quantity_kwh=quantity_kwh,
            price_per_kwh=price_per_kwh,
            status=status,
            description=description,
        )
        record = await result.single()
        if record:
            node = record["l"]
            logger.info("✅ Listing node created/updated: %s", title)
            return dict(node)
        return {}


async def create_contract_node(
    contract_id: str,
    buyer_id: str,
    producer_id: str,
    listing_id: Optional[str],
    volume_kwh: float,
    price_per_kwh: float,
    total_amount: float,
    contract_type: str = "spot",
    status: str = "pending",
) -> Dict[str, Any]:
    """
    Create a Contract node with relationships.
    
    Relationships created:
    - (User:Buyer)-[:BOUGHT]->(Contract)
    - (Contract)-[:FROM]->(Producer)
    - (Contract)-[:FOR]->(Listing) if listing_id provided
    """
    query = """
    MERGE (c:Contract {contract_id: $contract_id})
    SET c.volume_kwh = $volume_kwh,
        c.price_per_kwh = $price_per_kwh,
        c.total_amount = $total_amount,
        c.contract_type = $contract_type,
        c.status = $status,
        c.updated_at = datetime()
    ON CREATE SET c.created_at = datetime()
    
    WITH c
    MATCH (buyer:User {user_id: $buyer_id})
    MERGE (buyer)-[:BOUGHT]->(c)
    
    WITH c
    MATCH (producer:Producer {producer_id: $producer_id})
    MERGE (c)-[:FROM]->(producer)
    MERGE (buyer)-[:TRADED_WITH]->(producer)
    
    WITH c
    OPTIONAL MATCH (l:Listing {listing_id: $listing_id})
    FOREACH (_ IN CASE WHEN l IS NOT NULL THEN [1] ELSE [] END |
        MERGE (c)-[:FOR]->(l)
    )
    
    RETURN c
    """
    
    async with get_session() as session:
        result = await session.run(
            query,
            contract_id=contract_id,
            buyer_id=buyer_id,
            producer_id=producer_id,
            listing_id=listing_id,
            volume_kwh=volume_kwh,
            price_per_kwh=price_per_kwh,
            total_amount=total_amount,
            contract_type=contract_type,
            status=status,
        )
        record = await result.single()
        if record:
            node = record["c"]
            logger.info("✅ Contract node created: %s", contract_id)
            return dict(node)
        return {}


# ══════════════════════════════════════════════════════════════
# RECOMMENDATION SYSTEM
# ══════════════════════════════════════════════════════════════

async def recommend_producers_for_user(
    user_id: str,
    limit: int = 10,
    energy_source_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Recommend producers to a user based on graph relationships.
    
    Algorithm:
    1. Find producers that similar users have bought from
    2. Prioritize by common energy source preferences
    3. Consider location proximity
    4. Rank by trading volume and positive relationships
    
    Args:
        user_id: The user to generate recommendations for
        limit: Maximum number of recommendations
        energy_source_filter: Optional filter by energy source
        
    Returns:
        List of recommended producers with scores
    """
    query = """
    // Find the user
    MATCH (user:User {user_id: $user_id})
    
    // Find producers the user has already traded with
    OPTIONAL MATCH (user)-[:TRADED_WITH]->(already:Producer)
    WITH user, COLLECT(already.producer_id) AS already_traded
    
    // Find similar users (traded with same producers)
    OPTIONAL MATCH (user)-[:TRADED_WITH]->(:Producer)<-[:TRADED_WITH]-(similar:User)
    WHERE similar.user_id <> user.user_id
    
    // Find producers that similar users traded with
    OPTIONAL MATCH (similar)-[:TRADED_WITH]->(rec:Producer)
    WHERE NOT rec.producer_id IN already_traded
    AND rec.status = 'approved'
    AND ($energy_source_filter IS NULL 
         OR $energy_source_filter IN rec.energy_sources)
    
    // Calculate recommendation score
    WITH DISTINCT rec, 
         COUNT(DISTINCT similar) AS similar_users_count,
         user
    WHERE rec IS NOT NULL
    
    // Get additional scoring factors
    OPTIONAL MATCH (rec)<-[:TRADED_WITH]-(trader:User)
    WITH rec, similar_users_count, COUNT(DISTINCT trader) AS total_traders
    
    OPTIONAL MATCH (rec)-[:LISTED]->(listing:Listing {status: 'active'})
    WITH rec, similar_users_count, total_traders, COUNT(listing) AS active_listings
    
    // Calculate final score
    WITH rec,
         similar_users_count * 3 + total_traders + active_listings AS score,
         similar_users_count,
         total_traders,
         active_listings
    
    RETURN {
        producer_id: rec.producer_id,
        company_name: rec.company_name,
        energy_sources: rec.energy_sources,
        capacity_kw: rec.capacity_kw,
        location: rec.location,
        recommendation_score: score,
        similar_users_traded: similar_users_count,
        total_traders: total_traders,
        active_listings: active_listings
    } AS recommendation
    ORDER BY score DESC
    LIMIT $limit
    """
    
    async with get_session() as session:
        result = await session.run(
            query,
            user_id=user_id,
            limit=limit,
            energy_source_filter=energy_source_filter,
        )
        records = await result.data()
        recommendations = [r["recommendation"] for r in records if r["recommendation"]["producer_id"]]
        logger.info("🎯 Generated %d producer recommendations for user %s", len(recommendations), user_id)
        return recommendations


async def recommend_similar_listings(
    listing_id: str,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Find similar energy listings based on graph patterns.
    
    Similarity based on:
    - Same energy source
    - Same producer (other listings)
    - Bought by users who also bought this listing
    """
    query = """
    MATCH (listing:Listing {listing_id: $listing_id})
    
    // Find similar by same energy source
    OPTIONAL MATCH (similar:Listing)
    WHERE similar.listing_id <> listing.listing_id
    AND similar.energy_source = listing.energy_source
    AND similar.status = 'active'
    
    // Calculate price similarity (closer prices = higher score)
    WITH listing, similar,
         1.0 / (1 + ABS(similar.price_per_kwh - listing.price_per_kwh)) AS price_similarity
    
    // Get listing producers
    OPTIONAL MATCH (similar)<-[:LISTED]-(producer:Producer)
    
    RETURN {
        listing_id: similar.listing_id,
        title: similar.title,
        energy_source: similar.energy_source,
        quantity_kwh: similar.quantity_kwh,
        price_per_kwh: similar.price_per_kwh,
        producer: producer.company_name,
        similarity_score: price_similarity
    } AS similar_listing
    ORDER BY price_similarity DESC
    LIMIT $limit
    """
    
    async with get_session() as session:
        result = await session.run(query, listing_id=listing_id, limit=limit)
        records = await result.data()
        return [r["similar_listing"] for r in records if r["similar_listing"]["listing_id"]]


async def get_users_who_bought_similar(
    user_id: str,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Find users with similar trading patterns.
    Useful for community features and collaborative filtering.
    """
    query = """
    MATCH (user:User {user_id: $user_id})
    
    // Find producers user has traded with
    MATCH (user)-[:TRADED_WITH]->(producer:Producer)
    
    // Find other users who traded with same producers
    MATCH (similar:User)-[:TRADED_WITH]->(producer)
    WHERE similar.user_id <> user.user_id
    
    // Count shared producers
    WITH similar, COUNT(DISTINCT producer) AS shared_producers
    
    RETURN {
        user_id: similar.user_id,
        full_name: similar.full_name,
        shared_producers: shared_producers
    } AS similar_user
    ORDER BY shared_producers DESC
    LIMIT $limit
    """
    
    async with get_session() as session:
        result = await session.run(query, user_id=user_id, limit=limit)
        records = await result.data()
        return [r["similar_user"] for r in records]


# ══════════════════════════════════════════════════════════════
# ANALYTICS & INSIGHTS
# ══════════════════════════════════════════════════════════════

async def get_energy_flow_analytics() -> Dict[str, Any]:
    """
    Get overall energy trading flow analytics.
    
    Returns aggregated statistics about energy flow through the platform.
    """
    query = """
    // Total energy traded
    MATCH (c:Contract)
    WHERE c.status IN ['active', 'settled']
    WITH SUM(c.volume_kwh) AS total_volume_kwh,
         SUM(c.total_amount) AS total_amount,
         COUNT(c) AS total_contracts
    
    // Get energy source distribution
    MATCH (l:Listing)
    WITH total_volume_kwh, total_amount, total_contracts,
         l.energy_source AS source, SUM(l.quantity_kwh) AS source_volume
    
    RETURN {
        total_energy_traded_kwh: total_volume_kwh,
        total_transaction_value: total_amount,
        total_contracts: total_contracts,
        energy_by_source: COLLECT({source: source, volume_kwh: source_volume})
    } AS analytics
    """
    
    async with get_session() as session:
        result = await session.run(query)
        record = await result.single()
        if record:
            return record["analytics"]
        return {}


async def get_producer_rankings(
    energy_source: Optional[str] = None,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Rank producers by trading activity and performance.
    
    Args:
        energy_source: Filter by specific energy source
        limit: Number of top producers to return
    """
    query = """
    MATCH (p:Producer)
    WHERE p.status = 'approved'
    AND ($energy_source IS NULL OR $energy_source IN p.energy_sources)
    
    // Count contracts and volume
    OPTIONAL MATCH (c:Contract)-[:FROM]->(p)
    WHERE c.status IN ['active', 'settled']
    WITH p, 
         COUNT(c) AS contract_count,
         COALESCE(SUM(c.volume_kwh), 0) AS total_volume,
         COALESCE(SUM(c.total_amount), 0) AS total_revenue
    
    // Count unique buyers
    OPTIONAL MATCH (buyer:User)-[:TRADED_WITH]->(p)
    WITH p, contract_count, total_volume, total_revenue,
         COUNT(DISTINCT buyer) AS unique_buyers
    
    // Count active listings
    OPTIONAL MATCH (p)-[:LISTED]->(l:Listing {status: 'active'})
    WITH p, contract_count, total_volume, total_revenue, unique_buyers,
         COUNT(l) AS active_listings
    
    // Calculate ranking score
    WITH p,
         contract_count * 2 + unique_buyers * 3 + active_listings AS ranking_score,
         contract_count, total_volume, total_revenue, unique_buyers, active_listings
    
    RETURN {
        producer_id: p.producer_id,
        company_name: p.company_name,
        energy_sources: p.energy_sources,
        capacity_kw: p.capacity_kw,
        location: p.location,
        stats: {
            contract_count: contract_count,
            total_volume_kwh: total_volume,
            total_revenue: total_revenue,
            unique_buyers: unique_buyers,
            active_listings: active_listings
        },
        ranking_score: ranking_score
    } AS producer
    ORDER BY ranking_score DESC
    LIMIT $limit
    """
    
    async with get_session() as session:
        result = await session.run(
            query, 
            energy_source=energy_source, 
            limit=limit
        )
        records = await result.data()
        return [r["producer"] for r in records]


async def get_user_trading_graph(user_id: str) -> Dict[str, Any]:
    """
    Get the complete trading graph for a user.
    
    Returns all producers, listings, and contracts connected to the user.
    """
    query = """
    MATCH (user:User {user_id: $user_id})
    
    // Get owned producers
    OPTIONAL MATCH (user)-[:OWNS]->(owned_producer:Producer)
    
    // Get traded producers
    OPTIONAL MATCH (user)-[:TRADED_WITH]->(traded_producer:Producer)
    
    // Get user's contracts
    OPTIONAL MATCH (user)-[:BOUGHT]->(contract:Contract)
    OPTIONAL MATCH (contract)-[:FROM]->(contract_producer:Producer)
    OPTIONAL MATCH (contract)-[:FOR]->(contract_listing:Listing)
    
    RETURN {
        user: {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        },
        owned_producers: COLLECT(DISTINCT {
            producer_id: owned_producer.producer_id,
            company_name: owned_producer.company_name,
            energy_sources: owned_producer.energy_sources
        }),
        traded_producers: COLLECT(DISTINCT {
            producer_id: traded_producer.producer_id,
            company_name: traded_producer.company_name
        }),
        contracts: COLLECT(DISTINCT {
            contract_id: contract.contract_id,
            volume_kwh: contract.volume_kwh,
            total_amount: contract.total_amount,
            status: contract.status,
            producer: contract_producer.company_name,
            listing_title: contract_listing.title
        })
    } AS trading_graph
    """
    
    async with get_session() as session:
        result = await session.run(query, user_id=user_id)
        record = await result.single()
        if record:
            graph = record["trading_graph"]
            # Filter out null entries
            graph["owned_producers"] = [p for p in graph["owned_producers"] if p["producer_id"]]
            graph["traded_producers"] = [p for p in graph["traded_producers"] if p["producer_id"]]
            graph["contracts"] = [c for c in graph["contracts"] if c["contract_id"]]
            return graph
        return {}


async def find_energy_path(
    from_user_id: str,
    to_producer_id: str,
    max_hops: int = 4,
) -> List[Dict[str, Any]]:
    """
    Find the relationship path between a user and a producer.
    
    Useful for understanding connections and trust chains.
    """
    query = """
    MATCH (start:User {user_id: $from_user_id})
    MATCH (end:Producer {producer_id: $to_producer_id})
    
    MATCH path = shortestPath((start)-[*1..$max_hops]-(end))
    
    RETURN [node IN nodes(path) | 
        CASE 
            WHEN 'User' IN labels(node) THEN {type: 'User', id: node.user_id, name: node.full_name}
            WHEN 'Producer' IN labels(node) THEN {type: 'Producer', id: node.producer_id, name: node.company_name}
            WHEN 'Listing' IN labels(node) THEN {type: 'Listing', id: node.listing_id, name: node.title}
            WHEN 'Contract' IN labels(node) THEN {type: 'Contract', id: node.contract_id, name: 'Contract'}
            ELSE {type: 'Unknown', id: '', name: ''}
        END
    ] AS path_nodes,
    [rel IN relationships(path) | type(rel)] AS relationship_types,
    length(path) AS path_length
    """
    
    async with get_session() as session:
        result = await session.run(
            query,
            from_user_id=from_user_id,
            to_producer_id=to_producer_id,
            max_hops=max_hops,
        )
        record = await result.single()
        if record:
            return {
                "path_nodes": record["path_nodes"],
                "relationship_types": record["relationship_types"],
                "path_length": record["path_length"],
            }
        return {"path_nodes": [], "relationship_types": [], "path_length": -1}


# ══════════════════════════════════════════════════════════════
# SYNC FROM MONGODB
# ══════════════════════════════════════════════════════════════

async def sync_user_to_neo4j(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Sync a MongoDB User document to Neo4j."""
    return await create_user_node(
        user_id=str(user_doc.get("_id", user_doc.get("id", ""))),
        email=user_doc.get("email", ""),
        full_name=user_doc.get("full_name", ""),
        role=user_doc.get("role", "consumer"),
        is_active=user_doc.get("is_active", True),
    )


async def sync_producer_to_neo4j(producer_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Sync a MongoDB Producer document to Neo4j."""
    return await create_producer_node(
        producer_id=str(producer_doc.get("_id", producer_doc.get("id", ""))),
        owner_id=str(producer_doc.get("owner_id", "")),
        company_name=producer_doc.get("company_name", ""),
        energy_sources=[e.value if hasattr(e, 'value') else str(e) for e in producer_doc.get("energy_sources", [])],
        capacity_kw=float(producer_doc.get("capacity_kw", 0)),
        location=producer_doc.get("location", ""),
        status=producer_doc.get("status", "pending"),
        description=producer_doc.get("description"),
    )


async def sync_listing_to_neo4j(listing_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Sync a MongoDB EnergyListing document to Neo4j."""
    energy_source = listing_doc.get("energy_source", "")
    if hasattr(energy_source, 'value'):
        energy_source = energy_source.value
        
    return await create_listing_node(
        listing_id=str(listing_doc.get("_id", listing_doc.get("id", ""))),
        producer_id=str(listing_doc.get("producer_id", "")),
        owner_id=str(listing_doc.get("owner_id", "")),
        title=listing_doc.get("title", ""),
        energy_source=str(energy_source),
        quantity_kwh=float(listing_doc.get("quantity_kwh", 0)),
        price_per_kwh=float(listing_doc.get("price_per_kwh", 0)),
        status=listing_doc.get("status", "active"),
        description=listing_doc.get("description"),
    )


async def sync_contract_to_neo4j(contract_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Sync a MongoDB Contract document to Neo4j."""
    return await create_contract_node(
        contract_id=str(contract_doc.get("_id", contract_doc.get("id", ""))),
        buyer_id=str(contract_doc.get("buyer_id", "")),
        producer_id=str(contract_doc.get("producer_id", "")),
        listing_id=str(contract_doc.get("listing_id", "")) if contract_doc.get("listing_id") else None,
        volume_kwh=float(contract_doc.get("volume_kwh", 0)),
        price_per_kwh=float(contract_doc.get("price_per_kwh", 0)),
        total_amount=float(contract_doc.get("total_amount", 0)),
        contract_type=contract_doc.get("contract_type", "spot"),
        status=contract_doc.get("status", "pending"),
    )


async def full_sync_from_mongodb():
    """
    Perform a full sync of all MongoDB data to Neo4j.
    
    Call this to initialize or refresh the Neo4j graph from MongoDB.
    """
    from app.models.users import User
    from app.models.producers import Producer
    from app.models.energy import EnergyListing
    from app.models.contracts import Contract
    
    logger.info("🔄 Starting full sync from MongoDB to Neo4j...")
    
    # Sync users
    users = await User.find_all().to_list()
    for user in users:
        await sync_user_to_neo4j(user.model_dump())
    logger.info("✅ Synced %d users", len(users))
    
    # Sync producers
    producers = await Producer.find_all().to_list()
    for producer in producers:
        await sync_producer_to_neo4j(producer.model_dump())
    logger.info("✅ Synced %d producers", len(producers))
    
    # Sync listings
    listings = await EnergyListing.find_all().to_list()
    for listing in listings:
        await sync_listing_to_neo4j(listing.model_dump())
    logger.info("✅ Synced %d listings", len(listings))
    
    # Sync contracts
    contracts = await Contract.find_all().to_list()
    for contract in contracts:
        await sync_contract_to_neo4j(contract.model_dump())
    logger.info("✅ Synced %d contracts", len(contracts))
    
    logger.info("🎉 Full sync complete!")
    
    return {
        "users": len(users),
        "producers": len(producers),
        "listings": len(listings),
        "contracts": len(contracts),
    }


# ══════════════════════════════════════════════════════════════
# GRAPH HEALTH & STATUS
# ══════════════════════════════════════════════════════════════

async def get_graph_stats() -> Dict[str, Any]:
    """Get statistics about the Neo4j graph."""
    query = """
    MATCH (n)
    WITH labels(n) AS types, COUNT(*) AS count
    RETURN types, count
    """
    
    async with get_session() as session:
        result = await session.run(query)
        records = await result.data()
        
        stats = {"nodes": {}}
        for record in records:
            label = record["types"][0] if record["types"] else "Unknown"
            stats["nodes"][label] = record["count"]
        
        # Count relationships
        rel_query = """
        MATCH ()-[r]->()
        WITH type(r) AS rel_type, COUNT(*) AS count
        RETURN rel_type, count
        """
        
        rel_result = await session.run(rel_query)
        rel_records = await rel_result.data()
        
        stats["relationships"] = {}
        for record in rel_records:
            stats["relationships"][record["rel_type"]] = record["count"]
        
        return stats


async def health_check() -> Dict[str, Any]:
    """Check Neo4j connection health."""
    if not is_available():
        return {
            "status": "unavailable",
            "error": "Neo4j driver not initialised (instance may be paused)",
            "uri": NEO4J_URI,
        }
    try:
        driver = get_driver()
        await driver.verify_connectivity()
        stats = await get_graph_stats()
        return {
            "status": "healthy",
            "uri": NEO4J_URI,
            "stats": stats,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }


# ══════════════════════════════════════════════════════════════
# CUSTOM CYPHER QUERY EXECUTION
# ══════════════════════════════════════════════════════════════

async def run_custom_query(query: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Execute a custom Cypher query and return graph-structured results.
    
    Returns nodes and edges in a format suitable for graph visualization.
    """
    if params is None:
        params = {}
    
    async with get_session() as session:
        result = await session.run(query, params)
        
        nodes = []
        edges = []
        node_ids = set()
        records_data = []
        
        async for record in result:
            record_dict = {}
            for key in record.keys():
                value = record[key]
                record_dict[key] = _serialize_value(value)
                
                if value is None:
                    continue
                
                # Check if it's a Neo4j Node object
                if hasattr(value, 'element_id') and hasattr(value, 'labels'):
                    node_id = value.element_id
                    if node_id not in node_ids:
                        node_ids.add(node_id)
                        labels_list = list(value.labels) if value.labels else ["Node"]
                        props = dict(value) if hasattr(value, '__iter__') else {}
                        nodes.append({
                            "id": node_id,
                            "label": labels_list[0] if labels_list else "Node",
                            "properties": props,
                        })
                
                # Check if it's a Neo4j Relationship object
                elif hasattr(value, 'type') and hasattr(value, 'start_node'):
                    source_id = value.start_node.element_id if hasattr(value.start_node, 'element_id') else str(value.start_node)
                    target_id = value.end_node.element_id if hasattr(value.end_node, 'element_id') else str(value.end_node)
                    edges.append({
                        "source": source_id,
                        "target": target_id,
                        "type": value.type,
                    })
                    # Also add the connected nodes if not already added
                    for node in [value.start_node, value.end_node]:
                        if hasattr(node, 'element_id') and node.element_id not in node_ids:
                            node_ids.add(node.element_id)
                            labels_list = list(node.labels) if hasattr(node, 'labels') else ["Node"]
                            props = dict(node) if hasattr(node, '__iter__') else {}
                            nodes.append({
                                "id": node.element_id,
                                "label": labels_list[0] if labels_list else "Node",
                                "properties": props,
                            })
                
                # Check if it's a Path object
                elif hasattr(value, 'nodes') and hasattr(value, 'relationships'):
                    # Handle path - extract all nodes and relationships
                    for node in value.nodes:
                        if hasattr(node, 'element_id') and node.element_id not in node_ids:
                            node_ids.add(node.element_id)
                            labels_list = list(node.labels) if hasattr(node, 'labels') else ["Node"]
                            props = dict(node) if hasattr(node, '__iter__') else {}
                            nodes.append({
                                "id": node.element_id,
                                "label": labels_list[0] if labels_list else "Node",
                                "properties": props,
                            })
                    for rel in value.relationships:
                        edges.append({
                            "source": rel.start_node.element_id if hasattr(rel.start_node, 'element_id') else str(rel.start_node),
                            "target": rel.end_node.element_id if hasattr(rel.end_node, 'element_id') else str(rel.end_node),
                            "type": rel.type if hasattr(rel, 'type') else "RELATED",
                        })
            
            records_data.append(record_dict)
        
        return {
            "nodes": nodes,
            "edges": edges,
            "records": records_data[:100],  # Limit raw records
            "count": len(records_data),
        }


def _serialize_value(value):
    """Serialize Neo4j values for JSON response."""
    if value is None:
        return None
    if hasattr(value, 'element_id') and hasattr(value, 'labels'):
        # It's a Node
        return {"id": value.element_id, "labels": list(value.labels), "properties": dict(value)}
    if hasattr(value, 'type') and hasattr(value, 'start_node'):
        # It's a Relationship
        return {"type": value.type, "properties": dict(value)}
    if hasattr(value, 'nodes') and hasattr(value, 'relationships'):
        # It's a Path
        return {"length": len(value.relationships)}
    if isinstance(value, (list, tuple)):
        return [_serialize_value(v) for v in value]
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    return value

