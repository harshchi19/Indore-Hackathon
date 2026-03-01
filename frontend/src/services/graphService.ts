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
};
