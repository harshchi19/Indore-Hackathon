import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificatesService } from "@/services/certificatesService";
import type {
  CertificateListResponse,
  CertificateResponse,
  CertificateIssueRequest,
  CertificateVerifyResponse,
} from "@/types";

/* ── Query keys ──────────────────────────────────────── */

export const certificateKeys = {
  all: ["certificates"] as const,
  lists: () => [...certificateKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...certificateKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...certificateKeys.all, "detail", id] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function useCertificates(params?: {
  contract_id?: string;
  producer_id?: string;
  valid_only?: boolean;
  skip?: number;
  limit?: number;
}) {
  return useQuery<CertificateListResponse, Error>({
    queryKey: certificateKeys.list(params as Record<string, unknown>),
    queryFn: () => certificatesService.list(params),
    staleTime: 60_000,
  });
}

export function useCertificate(id: string) {
  return useQuery<CertificateResponse, Error>({
    queryKey: certificateKeys.detail(id),
    queryFn: () => certificatesService.getById(id),
    enabled: !!id,
  });
}

export function useIssueCertificate() {
  const qc = useQueryClient();
  return useMutation<CertificateResponse, Error, CertificateIssueRequest>({
    mutationFn: (payload) => certificatesService.issue(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useVerifyCertificate() {
  return useMutation<CertificateVerifyResponse, Error, string>({
    mutationFn: (certId) => certificatesService.verify(certId),
  });
}
