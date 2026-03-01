import { EnergySource, ProducerStatus } from "./enums";

/* ── Request ─────────────────────────────────────────── */

export interface ProducerCreateRequest {
  company_name: string;
  description?: string;
  energy_sources: EnergySource[];
  capacity_kw: number;
  location: string;
}

/* ── Response ────────────────────────────────────────── */

export interface ProducerResponse {
  id: string;
  owner_id: string;
  company_name: string;
  description?: string;
  energy_sources: EnergySource[];
  capacity_kw: number;
  location: string;
  status: ProducerStatus;
  created_at: string;
  updated_at?: string;
}

export interface ProducerListResponse {
  total: number;
  items: ProducerResponse[];
}
