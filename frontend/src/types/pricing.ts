import { EnergySource } from "./enums";

export interface SpotPriceResponse {
  energy_source: EnergySource;
  price_per_kwh: number;
  currency: string;
  timestamp: string;
}

export interface HistoricalPricePoint {
  timestamp: string;
  price_per_kwh: number;
}

export interface HistoricalPriceResponse {
  energy_source: EnergySource;
  currency: string;
  data: HistoricalPricePoint[];
}
