import apiClient from "./apiClient";
import type {
  ContractCreateRequest,
  ContractSignRequest,
  ContractResponse,
  ContractListResponse,
  ContractStatus,
} from "@/types";

export const contractsService = {
  async create(payload: ContractCreateRequest): Promise<ContractResponse> {
    const { data } = await apiClient.post<ContractResponse>(
      "/contracts",
      payload,
    );
    return data;
  },

  async list(params?: {
    buyer_id?: string;
    producer_id?: string;
    status?: ContractStatus;
    skip?: number;
    limit?: number;
  }): Promise<ContractListResponse> {
    const { data } = await apiClient.get<ContractListResponse>("/contracts", {
      params,
    });
    return data;
  },

  async getById(contractId: string): Promise<ContractResponse> {
    const { data } = await apiClient.get<ContractResponse>(
      `/contracts/${contractId}`,
    );
    return data;
  },

  async sign(
    contractId: string,
    payload: ContractSignRequest,
  ): Promise<ContractResponse> {
    const { data } = await apiClient.post<ContractResponse>(
      `/contracts/${contractId}/sign`,
      payload,
    );
    return data;
  },

  async settle(contractId: string): Promise<ContractResponse> {
    const { data } = await apiClient.post<ContractResponse>(
      `/contracts/${contractId}/settle`,
    );
    return data;
  },

  async dispute(contractId: string): Promise<ContractResponse> {
    const { data } = await apiClient.post<ContractResponse>(
      `/contracts/${contractId}/dispute`,
    );
    return data;
  },
};
