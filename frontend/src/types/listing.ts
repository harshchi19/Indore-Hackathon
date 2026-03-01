import { EnergySource, ListingStatus } from "./enums";

/* ── Request ─────────────────────────────────────────── */

export interface EnergyListingCreateRequest {
  producer_id: string;
  title: string;
  description?: string;
  energy_source: EnergySource;
  quantity_kwh: number;
  price_per_kwh: number;
  min_purchase_kwh?: number;
  available_until?: string;
}

export interface BuyEnergyRequest {
  listing_id: string;
  quantity_kwh: number;
}

/* ── Response ────────────────────────────────────────── */

export interface EnergyListingResponse {
  id: string;
  producer_id: string;
  owner_id: string;
  title: string;
  description?: string;
  energy_source: EnergySource;
  quantity_kwh: number;
  price_per_kwh: number;
  min_purchase_kwh: number;
  status: ListingStatus;
  available_from: string;
  available_until?: string;
  created_at: string;
  updated_at?: string;
}

export interface EnergyListingListResponse {
  total: number;
  items: EnergyListingResponse[];
}

export interface BuyEnergyResponse {
  detail: string;
  listing_id: string;
  quantity_kwh: number;
}
