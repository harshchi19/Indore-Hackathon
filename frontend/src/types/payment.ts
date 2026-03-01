import { PaymentStatus } from "./enums";

/* ── Request ─────────────────────────────────────────── */

export interface PaymentInitiateRequest {
  contract_id: string;
  amount_eur: number;
}

export interface PaymentWebhookPayload {
  payment_id: string;
  status: PaymentStatus;
  transaction_ref?: string;
}

/* ── Response ────────────────────────────────────────── */

export interface PaymentResponse {
  id: string;
  contract_id: string;
  buyer_id: string;
  amount_eur: number;
  status: PaymentStatus;
  escrow_lock: boolean;
  transaction_ref?: string;
  settled_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentListResponse {
  total: number;
  items: PaymentResponse[];
}
