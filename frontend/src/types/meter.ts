import { MeterReadingStatus } from "./enums";

/* ── Request ─────────────────────────────────────────── */

export interface MeterReadingIngestRequest {
  device_id: string;
  producer_id: string;
  reading_kwh: number;
  timestamp?: string;
}

export interface MeterReadingBatchIngestRequest {
  readings: MeterReadingIngestRequest[];
}

/* ── Response ────────────────────────────────────────── */

export interface MeterReadingResponse {
  id: string;
  device_id: string;
  producer_id: string;
  reading_kwh: number;
  previous_reading_kwh?: number;
  status: MeterReadingStatus;
  anomaly_reason?: string;
  timestamp: string;
  created_at: string;
  updated_at?: string;
}

export interface MeterReadingListResponse {
  total: number;
  items: MeterReadingResponse[];
}

export interface AnomalyReport {
  device_id: string;
  total_readings: number;
  anomalies: number;
  anomaly_rate: number;
  recent_anomalies: MeterReadingResponse[];
}
