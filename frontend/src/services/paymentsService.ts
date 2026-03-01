import apiClient from "./apiClient";
import type {
  PaymentInitiateRequest,
  PaymentResponse,
  PaymentListResponse,
  PaymentStatus,
} from "@/types";

export const paymentsService = {
  async initiate(payload: PaymentInitiateRequest): Promise<PaymentResponse> {
    const { data } = await apiClient.post<PaymentResponse>(
      "/payments",
      payload,
    );
    return data;
  },

  async list(params?: {
    contract_id?: string;
    buyer_id?: string;
    status?: PaymentStatus;
    skip?: number;
    limit?: number;
  }): Promise<PaymentListResponse> {
    const { data } = await apiClient.get<PaymentListResponse>("/payments", {
      params,
    });
    return data;
  },

  async getById(paymentId: string): Promise<PaymentResponse> {
    const { data } = await apiClient.get<PaymentResponse>(
      `/payments/${paymentId}`,
    );
    return data;
  },

  async settle(contractId: string): Promise<PaymentResponse> {
    const { data } = await apiClient.post<PaymentResponse>(
      `/payments/${contractId}/settle`,
    );
    return data;
  },
};
