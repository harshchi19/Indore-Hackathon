import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meterService } from "@/services/meterService";
import type {
  MeterReadingListResponse,
  MeterReadingResponse,
  MeterReadingIngestRequest,
  MeterReadingBatchIngestRequest,
  AnomalyReport,
  MeterReadingStatus,
} from "@/types";

/* ── Query keys ──────────────────────────────────────── */

export const meterKeys = {
  all: ["meters"] as const,
  readings: () => [...meterKeys.all, "readings"] as const,
  readingList: (params?: Record<string, unknown>) =>
    [...meterKeys.readings(), params ?? {}] as const,
  anomalies: (deviceId: string) =>
    [...meterKeys.all, "anomalies", deviceId] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function useMeters(params?: {
  device_id?: string;
  producer_id?: string;
  status?: MeterReadingStatus;
  skip?: number;
  limit?: number;
}) {
  return useQuery<MeterReadingListResponse, Error>({
    queryKey: meterKeys.readingList(params as Record<string, unknown>),
    queryFn: () => meterService.listReadings(params),
    staleTime: 15_000,
  });
}

export function useAnomalyReport(deviceId: string) {
  return useQuery<AnomalyReport, Error>({
    queryKey: meterKeys.anomalies(deviceId),
    queryFn: () => meterService.getAnomalies(deviceId),
    enabled: !!deviceId,
    staleTime: 60_000,
  });
}

export function useIngestReading() {
  const qc = useQueryClient();
  return useMutation<MeterReadingResponse, Error, MeterReadingIngestRequest>({
    mutationFn: (payload) => meterService.ingestReading(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meterKeys.all });
    },
  });
}

export function useIngestBatch() {
  const qc = useQueryClient();
  return useMutation<MeterReadingResponse[], Error, MeterReadingBatchIngestRequest>({
    mutationFn: (payload) => meterService.ingestBatch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meterKeys.all });
    },
  });
}
