import apiClient from "./apiClient";
import type {
  CertificateIssueRequest,
  CertificateResponse,
  CertificateVerifyResponse,
  CertificateListResponse,
} from "@/types";

export const certificatesService = {
  async issue(
    payload: CertificateIssueRequest,
  ): Promise<CertificateResponse> {
    const { data } = await apiClient.post<CertificateResponse>(
      "/certificates",
      payload,
    );
    return data;
  },

  async list(params?: {
    contract_id?: string;
    producer_id?: string;
    valid_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<CertificateListResponse> {
    const { data } = await apiClient.get<CertificateListResponse>(
      "/certificates",
      { params },
    );
    return data;
  },

  async getById(certificateId: string): Promise<CertificateResponse> {
    const { data } = await apiClient.get<CertificateResponse>(
      `/certificates/${certificateId}`,
    );
    return data;
  },

  async verify(certificateId: string): Promise<CertificateVerifyResponse> {
    const { data } = await apiClient.post<CertificateVerifyResponse>(
      `/certificates/${certificateId}/verify`,
    );
    return data;
  },
};
