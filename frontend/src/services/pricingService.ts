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

  /** Returns a WebSocket URL for the real-time price stream. */
  getWebSocketUrl(): string {
    const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (apiBase && /^https?:\/\//.test(apiBase)) {
      return apiBase.replace(/^http/, "ws") + "/pricing/ws/stream";
    }
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const path = apiBase ?? "/api/v1";
    return `${proto}//${window.location.host}${path}/pricing/ws/stream`;
  },
};
