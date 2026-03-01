import { ContractType, ContractStatus } from "./enums";

/* ── Request ─────────────────────────────────────────── */

export interface ContractCreateRequest {
  buyer_id: string;
  producer_id: string;
  listing_id?: string;
  volume_kwh: number;
  price_per_kwh: number;
  contract_type?: ContractType;
}

export interface ContractSignRequest {
  role: "buyer" | "producer";
}

export interface ContractStatusUpdateRequest {
  status: ContractStatus;
}

/* ── Response ────────────────────────────────────────── */

export interface ContractResponse {
  id: string;
  buyer_id: string;
  producer_id: string;
  listing_id?: string;
  volume_kwh: number;
  price_per_kwh: number;
  total_amount: number;
  contract_type: ContractType;
  status: ContractStatus;
  contract_hash?: string;
  signature_buyer: boolean;
  signature_producer: boolean;
  settled_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContractListResponse {
  total: number;
  items: ContractResponse[];
}
