import apiClient from "./apiClient";
import type {
  CO2Report,
  MonthlyAnalytics,
  AnalyticsDashboard,
  ProducerPerformance,
} from "@/types";

export const analyticsService = {
  async getCO2(contractId: string): Promise<CO2Report> {
    const { data } = await apiClient.get<CO2Report>(
      `/analytics/co2/${contractId}`,
    );
    return data;
  },

  async getMonthly(params: {
    year: number;
    month?: number;
    producer_id?: string;
  }): Promise<MonthlyAnalytics[]> {
    const { data } = await apiClient.get<MonthlyAnalytics[]>(
      "/analytics/monthly",
      { params },
    );
    return data;
  },

  async getDashboard(producerId?: string): Promise<AnalyticsDashboard> {
    const { data } = await apiClient.get<AnalyticsDashboard>(
      "/analytics/dashboard",
      { params: producerId ? { producer_id: producerId } : {} },
    );
    return data;
  },

  async getProducerPerformance(
    topN = 10,
  ): Promise<ProducerPerformance[]> {
    const { data } = await apiClient.get<ProducerPerformance[]>(
      "/analytics/producers/performance",
      { params: { top_n: topN } },
    );
    return data;
  },
};
