import apiClient from "./apiClient";
import type {
  DisputeCreateRequest,
  DisputeAddEvidenceRequest,
  DisputeResolveRequest,
  DisputeResponse,
  DisputeListResponse,
  DisputeStatus,
} from "@/types";

export const disputeService = {
  async create(payload: DisputeCreateRequest): Promise<DisputeResponse> {
    const { data } = await apiClient.post<DisputeResponse>(
      "/disputes",
      payload,
    );
    return data;
  },

  async list(params?: {
    contract_id?: string;
    raised_by?: string;
    status?: DisputeStatus;
    skip?: number;
    limit?: number;
  }): Promise<DisputeListResponse> {
    const { data } = await apiClient.get<DisputeListResponse>("/disputes", {
      params,
    });
    return data;
  },

  async getById(disputeId: string): Promise<DisputeResponse> {
    const { data } = await apiClient.get<DisputeResponse>(
      `/disputes/${disputeId}`,
    );
    return data;
  },

  async addEvidence(
    disputeId: string,
    payload: DisputeAddEvidenceRequest,
  ): Promise<DisputeResponse> {
    const { data } = await apiClient.post<DisputeResponse>(
      `/disputes/${disputeId}/evidence`,
      payload,
    );
    return data;
  },

  async resolve(
    disputeId: string,
    payload: DisputeResolveRequest,
  ): Promise<DisputeResponse> {
    const { data } = await apiClient.post<DisputeResponse>(
      `/disputes/${disputeId}/resolve`,
      payload,
    );
    return data;
  },
};
