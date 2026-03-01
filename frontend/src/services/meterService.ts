import apiClient from "./apiClient";
import type {
  MeterReadingIngestRequest,
  MeterReadingBatchIngestRequest,
  MeterReadingResponse,
  MeterReadingListResponse,
  AnomalyReport,
  MeterReadingStatus,
} from "@/types";

export const meterService = {
  async ingestReading(
    payload: MeterReadingIngestRequest,
  ): Promise<MeterReadingResponse> {
    const { data } = await apiClient.post<MeterReadingResponse>(
      "/meters/readings",
      payload,
    );
    return data;
  },

  async ingestBatch(
    payload: MeterReadingBatchIngestRequest,
  ): Promise<MeterReadingResponse[]> {
    const { data } = await apiClient.post<MeterReadingResponse[]>(
      "/meters/readings/batch",
      payload,
    );
    return data;
  },

  async listReadings(params?: {
    device_id?: string;
    producer_id?: string;
    status?: MeterReadingStatus;
    skip?: number;
    limit?: number;
  }): Promise<MeterReadingListResponse> {
    const { data } = await apiClient.get<MeterReadingListResponse>(
      "/meters/readings",
      { params },
    );
    return data;
  },

  async getAnomalies(deviceId: string): Promise<AnomalyReport> {
    const { data } = await apiClient.get<AnomalyReport>(
      `/meters/anomalies/${deviceId}`,
    );
    return data;
  },
};
