import { DisputeStatus } from "./enums";

/* ── Request ─────────────────────────────────────────── */

export interface DisputeCreateRequest {
  contract_id: string;
  description: string;
}

export interface DisputeAddEvidenceRequest {
  file_url: string;
  description?: string;
}

export interface DisputeResolveRequest {
  resolution_note: string;
}

/* ── Embedded ────────────────────────────────────────── */

export interface EvidenceItem {
  file_url: string;
  description?: string;
  uploaded_at: string;
}

export interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
}

/* ── Response ────────────────────────────────────────── */

export interface DisputeResponse {
  id: string;
  contract_id: string;
  raised_by: string;
  status: DisputeStatus;
  description: string;
  resolution_note?: string;
  evidence: EvidenceItem[];
  audit_log: AuditEntry[];
  created_at: string;
  updated_at?: string;
}

export interface DisputeListResponse {
  total: number;
  items: DisputeResponse[];
}
