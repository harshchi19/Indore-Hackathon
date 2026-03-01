import apiClient from "./apiClient";
import type {
  SpotPriceResponse,
  HistoricalPriceResponse,
  EnergySource,
} from "@/types";

export const pricingService = {
  async getSpotPrice(source: EnergySource): Promise<SpotPriceResponse> {
    const { data } = await apiClient.get<SpotPriceResponse>("/pricing/spot", {
      params: { source },
    });
    return data;
  },

  async getAllSpotPrices(): Promise<SpotPriceResponse[]> {
    const { data } = await apiClient.get<SpotPriceResponse[]>(
      "/pricing/spot/all",
    );
    return data;
  },

  async getHistoricalPrices(
    source: EnergySource,
    hours = 24,
    intervalMinutes = 15,
  ): Promise<HistoricalPriceResponse> {
    const { data } = await apiClient.get<HistoricalPriceResponse>(
      "/pricing/historical",
      { params: { source, hours, interval_minutes: intervalMinutes } },
    );
    return data;
  },

};
