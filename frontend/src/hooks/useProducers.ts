import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketplaceService } from "@/services/marketplaceService";
import type {
  ProducerListResponse,
  ProducerResponse,
  ProducerCreateRequest,
  ProducerStatus,
} from "@/types";

/* ── Query keys ──────────────────────────────────────── */

export const producerKeys = {
  all: ["producers"] as const,
  lists: () => [...producerKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...producerKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...producerKeys.all, "detail", id] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function useProducers(params?: {
  status?: ProducerStatus;
  owner_id?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery<ProducerListResponse, Error>({
    queryKey: producerKeys.list(params as Record<string, unknown>),
    queryFn: () => marketplaceService.listProducers(params),
    staleTime: 60_000,
  });
}

export function useProducer(id: string) {
  return useQuery<ProducerResponse, Error>({
    queryKey: producerKeys.detail(id),
    queryFn: () => marketplaceService.getProducer(id),
    enabled: !!id,
  });
}

export function useCreateProducer() {
  const qc = useQueryClient();
  return useMutation<ProducerResponse, Error, ProducerCreateRequest>({
    mutationFn: (payload) => marketplaceService.createProducer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: producerKeys.all });
    },
  });
}

export function useVerifyProducer() {
  const qc = useQueryClient();
  return useMutation<ProducerResponse, Error, string>({
    mutationFn: (producerId) => marketplaceService.verifyProducer(producerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: producerKeys.all });
    },
  });
}
