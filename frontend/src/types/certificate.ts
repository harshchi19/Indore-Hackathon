import { EnergySource } from "./enums";

/* ── Request ─────────────────────────────────────────── */

export interface CertificateIssueRequest {
  contract_id: string;
  energy_source: EnergySource;
  validity_days?: number;
}

/* ── Response ────────────────────────────────────────── */

export interface CertificateResponse {
  id: string;
  contract_id: string;
  producer_id: string;
  buyer_id: string;
  energy_source: EnergySource;
  energy_amount_kwh: number;
  certificate_hash?: string;
  issued_at: string;
  expires_at?: string;
  valid: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CertificateVerifyResponse {
  certificate_id: string;
  valid: boolean;
  hash_match: boolean;
  expired: boolean;
  detail: string;
}

export interface CertificateListResponse {
  total: number;
  items: CertificateResponse[];
}
