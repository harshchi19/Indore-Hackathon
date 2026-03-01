import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { disputeService } from "@/services/disputeService";
import type {
  DisputeListResponse,
  DisputeResponse,
  DisputeCreateRequest,
  DisputeAddEvidenceRequest,
  DisputeResolveRequest,
  DisputeStatus,
} from "@/types";

/* ── Query keys ──────────────────────────────────────── */

export const disputeKeys = {
  all: ["disputes"] as const,
  lists: () => [...disputeKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...disputeKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...disputeKeys.all, "detail", id] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function useDisputes(params?: {
  contract_id?: string;
  raised_by?: string;
  status?: DisputeStatus;
  skip?: number;
  limit?: number;
}) {
  return useQuery<DisputeListResponse, Error>({
    queryKey: disputeKeys.list(params as Record<string, unknown>),
    queryFn: () => disputeService.list(params),
    staleTime: 30_000,
  });
}

export function useDispute(id: string) {
  return useQuery<DisputeResponse, Error>({
    queryKey: disputeKeys.detail(id),
    queryFn: () => disputeService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation<DisputeResponse, Error, DisputeCreateRequest>({
    mutationFn: (payload) => disputeService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.all });
    },
  });
}

export function useAddEvidence() {
  const qc = useQueryClient();
  return useMutation<
    DisputeResponse,
    Error,
    { disputeId: string; payload: DisputeAddEvidenceRequest }
  >({
    mutationFn: ({ disputeId, payload }) =>
      disputeService.addEvidence(disputeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.all });
    },
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation<
    DisputeResponse,
    Error,
    { disputeId: string; payload: DisputeResolveRequest }
  >({
    mutationFn: ({ disputeId, payload }) =>
      disputeService.resolve(disputeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.all });
    },
  });
}
