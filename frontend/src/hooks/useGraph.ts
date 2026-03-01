/**
 * React Query hooks for Neo4j Graph Database API
 */
import { useQuery } from "@tanstack/react-query";
import { graphService } from "@/services/graphService";
import { getAccessToken } from "@/services/apiClient";

export const graphKeys = {
  all: ["graph"] as const,
  health: () => [...graphKeys.all, "health"] as const,
  stats: () => [...graphKeys.all, "stats"] as const,
  energyFlow: () => [...graphKeys.all, "energy-flow"] as const,
  rankings: (limit?: number, source?: string) =>
    [...graphKeys.all, "rankings", limit, source] as const,
  userGraph: () => [...graphKeys.all, "user-graph"] as const,
  recommendations: (limit?: number, source?: string) =>
    [...graphKeys.all, "recommendations", limit, source] as const,
  similarUsers: (limit?: number) =>
    [...graphKeys.all, "similar-users", limit] as const,
};

export function useGraphHealth() {
  return useQuery({
    queryKey: graphKeys.health(),
    queryFn: () => graphService.getHealth(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useGraphStats() {
  return useQuery({
    queryKey: graphKeys.stats(),
    queryFn: () => graphService.getStats(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useEnergyFlow() {
  return useQuery({
    queryKey: graphKeys.energyFlow(),
    queryFn: () => graphService.getEnergyFlow(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useProducerRankings(limit = 5, energySource?: string) {
  return useQuery({
    queryKey: graphKeys.rankings(limit, energySource),
    queryFn: () => graphService.getProducerRankings(limit, energySource),
    staleTime: 60_000,
    retry: false,
  });
}

export function useUserTradingGraph() {
  return useQuery({
    queryKey: graphKeys.userGraph(),
    queryFn: () => graphService.getUserTradingGraph(),
    staleTime: 60_000,
    enabled: !!getAccessToken(),
    retry: false,
  });
}

export function useProducerRecommendations(limit = 5, energySource?: string) {
  return useQuery({
    queryKey: graphKeys.recommendations(limit, energySource),
    queryFn: () => graphService.getProducerRecommendations(limit, energySource),
    staleTime: 60_000,
    enabled: !!getAccessToken(),
    retry: false,
  });
}

export function useSimilarUsers(limit = 5) {
  return useQuery({
    queryKey: graphKeys.similarUsers(limit),
    queryFn: () => graphService.getSimilarUsers(limit),
    staleTime: 60_000,
    enabled: !!getAccessToken(),
    retry: false,
  });
}
