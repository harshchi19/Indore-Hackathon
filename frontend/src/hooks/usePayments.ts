import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "@/services/paymentsService";
import { getAccessToken } from "@/services/apiClient";
import type {
  PaymentListResponse,
  PaymentResponse,
  PaymentInitiateRequest,
  PaymentStatus,
} from "@/types";

/* ── Query keys ──────────────────────────────────────── */

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...paymentKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...paymentKeys.all, "detail", id] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function usePayments(params?: {
  contract_id?: string;
  buyer_id?: string;
  status?: PaymentStatus;
  skip?: number;
  limit?: number;
}) {
  return useQuery<PaymentListResponse, Error>({
    queryKey: paymentKeys.list(params as Record<string, unknown>),
    queryFn: () => paymentsService.list(params),
    staleTime: 30_000,
    enabled: !!getAccessToken(),
  });
}

export function usePayment(id: string) {
  return useQuery<PaymentResponse, Error>({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsService.getById(id),
    enabled: !!id,
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation<PaymentResponse, Error, PaymentInitiateRequest>({
    mutationFn: (payload) => paymentsService.initiate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

export function useSettlePayment() {
  const qc = useQueryClient();
  return useMutation<PaymentResponse, Error, string>({
    mutationFn: (contractId) => paymentsService.settle(contractId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
