import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";
import { getAccessToken } from "@/services/apiClient";
import type {
  CO2Report,
  MonthlyAnalytics,
  AnalyticsDashboard,
  ProducerPerformance,
} from "@/types";

/* ── Query keys ──────────────────────────────────────── */

export const analyticsKeys = {
  all: ["analytics"] as const,
  dashboard: (producerId?: string) =>
    [...analyticsKeys.all, "dashboard", producerId ?? "global"] as const,
  monthly: (params: { year: number; month?: number; producer_id?: string }) =>
    [...analyticsKeys.all, "monthly", params] as const,
  co2: (contractId: string) =>
    [...analyticsKeys.all, "co2", contractId] as const,
  producers: (topN: number) =>
    [...analyticsKeys.all, "producers", topN] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function useAnalytics(producerId?: string) {
  return useQuery<AnalyticsDashboard, Error>({
    queryKey: analyticsKeys.dashboard(producerId),
    queryFn: () => analyticsService.getDashboard(producerId),
    staleTime: 30_000,
    enabled: !!getAccessToken(),
  });
}

export function useMonthlyAnalytics(params: {
  year: number;
  month?: number;
  producer_id?: string;
}) {
  return useQuery<MonthlyAnalytics[], Error>({
    queryKey: analyticsKeys.monthly(params),
    queryFn: () => analyticsService.getMonthly(params),
    staleTime: 60_000,
  });
}

export function useCO2Report(contractId: string) {
  return useQuery<CO2Report, Error>({
    queryKey: analyticsKeys.co2(contractId),
    queryFn: () => analyticsService.getCO2(contractId),
    enabled: !!contractId,
    staleTime: 120_000,
  });
}

export function useProducerPerformance(topN = 10) {
  return useQuery<ProducerPerformance[], Error>({
    queryKey: analyticsKeys.producers(topN),
    queryFn: () => analyticsService.getProducerPerformance(topN),
    staleTime: 60_000,
  });
}
