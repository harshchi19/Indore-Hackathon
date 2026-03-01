/**
 * Neo4j Graph Database Service — frontend client
 * Calls /api/v1/graph/* endpoints for graph-based analytics & recommendations.
 */
import apiClient from "./apiClient";

export interface GraphStats {
  total_users: number;
  total_producers: number;
  total_listings: number;
  total_contracts: number;
  total_relationships: number;
}

export interface ProducerRanking {
  producer_id: string;
  name: string;
  company_name: string;
  energy_source: string;
  total_energy_kwh: number;
  total_contracts: number;
  rating: number;
  score: number;
}

export interface EnergyFlowAnalytics {
  total_energy_traded_kwh: number;
  total_transactions: number;
  top_energy_sources: { source: string; total_kwh: number }[];
  active_trade_routes: number;
  avg_contract_size_kwh: number;
}

export interface UserTradingGraph {
  user_id: string;
  owned_producers: { producer_id: string; name: string; energy_source: string }[];
  traded_producers: { producer_id: string; name: string; energy_source: string }[];
  contracts: { contract_id: string; producer: string; listing_title: string }[];
}

export interface ProducerRecommendation {
  producer_id: string;
  name: string;
  company_name: string;
  energy_source: string;
  similarity_score: number;
  reason: string;
}

export interface SimilarListing {
  listing_id: string;
  title: string;
  energy_source: string;
  price_per_kwh: number;
  similarity_score: number;
}

export interface ConnectionPath {
  from_user: string;
  to_producer: string;
  path_exists: boolean;
  hops: number;
  path: { node_type: string; node_id: string; name: string }[];
}

export interface SyncResult {
  users: number;
  producers: number;
  listings: number;
  contracts: number;
  relationships: number;
}

export const graphService = {
  async getHealth(): Promise<{ status: string; details?: any }> {
    const { data } = await apiClient.get("/graph/health");
    return data;
  },

  async getStats(): Promise<{ status: string; stats: GraphStats }> {
    const { data } = await apiClient.get("/graph/stats");
    return data;
  },

  async getEnergyFlow(): Promise<EnergyFlowAnalytics> {
    const { data } = await apiClient.get("/graph/analytics/energy-flow");
    return data;
  },

  async getProducerRankings(
    limit = 10,
    energySource?: string
  ): Promise<{ rankings: ProducerRanking[]; count: number }> {
    const { data } = await apiClient.get("/graph/analytics/producer-rankings", {
      params: { limit, ...(energySource ? { energy_source: energySource } : {}) },
    });
    return data;
  },

  async getUserTradingGraph(): Promise<UserTradingGraph> {
    const { data } = await apiClient.get("/graph/analytics/user-graph");
    return data;
  },

  async getProducerRecommendations(
    limit = 10,
    energySource?: string
  ): Promise<{ recommendations: ProducerRecommendation[]; count: number }> {
    const { data } = await apiClient.get("/graph/recommendations/producers", {
      params: { limit, ...(energySource ? { energy_source: energySource } : {}) },
    });
    return data;
  },

  async getSimilarUsers(
    limit = 5
  ): Promise<{ similar_users: any[]; count: number }> {
    const { data } = await apiClient.get("/graph/recommendations/similar-users", {
      params: { limit },
    });
    return data;
  },

  /* ── Similar Listings ─────────────────────────────── */

  async getSimilarListings(
    listingId: string,
    limit = 5
  ): Promise<{ listing_id: string; similar_listings: SimilarListing[]; count: number }> {
    const { data } = await apiClient.get(`/graph/recommendations/listings/${listingId}`, {
      params: { limit },
    });
    return data;
  },

  /* ── Connection Path ──────────────────────────────── */

  async findConnectionPath(
    producerId: string,
    maxHops = 4
  ): Promise<ConnectionPath> {
    const { data } = await apiClient.get(`/graph/analytics/path/${producerId}`, {
      params: { max_hops: maxHops },
    });
    return data;
  },

  /* ── Sync Operations (Admin) ──────────────────────── */

  async fullSync(): Promise<{ status: string; synced: SyncResult }> {
    const { data } = await apiClient.post("/graph/sync/full");
    return data;
  },

  async syncUser(userId: string): Promise<{ status: string; synced: any }> {
    const { data } = await apiClient.post(`/graph/sync/user/${userId}`);
    return data;
  },

  /* ── Custom Cypher Query ──────────────────────────── */

  async runQuery(
    query: string,
    params: Record<string, any> = {}
  ): Promise<{
    status: string;
    query: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    records: any[];
    count: number;
  }> {
    const { data } = await apiClient.post("/graph/query", { query, params });
    return data;
  },

  async getSampleQueries(): Promise<{
    queries: Array<{
      name: string;
      description: string;
      query: string;
    }>;
  }> {
    const { data } = await apiClient.get("/graph/sample-queries");
    return data;
  },
};

export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}
