import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractsService } from "@/services/contractsService";
import type {
  ContractListResponse,
  ContractResponse,
  ContractCreateRequest,
  ContractSignRequest,
  ContractStatus,
} from "@/types";

/* ── Query keys ──────────────────────────────────────── */

export const contractKeys = {
  all: ["contracts"] as const,
  lists: () => [...contractKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...contractKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...contractKeys.all, "detail", id] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function useContracts(params?: {
  buyer_id?: string;
  producer_id?: string;
  status?: ContractStatus;
  skip?: number;
  limit?: number;
}) {
  return useQuery<ContractListResponse, Error>({
    queryKey: contractKeys.list(params as Record<string, unknown>),
    queryFn: () => contractsService.list(params),
    staleTime: 30_000,
  });
}

export function useContract(id: string) {
  return useQuery<ContractResponse, Error>({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation<ContractResponse, Error, ContractCreateRequest>({
    mutationFn: (payload) => contractsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useSignContract() {
  const qc = useQueryClient();
  return useMutation<
    ContractResponse,
    Error,
    { contractId: string; payload: ContractSignRequest }
  >({
    mutationFn: ({ contractId, payload }) =>
      contractsService.sign(contractId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useSettleContract() {
  const qc = useQueryClient();
  return useMutation<ContractResponse, Error, string>({
    mutationFn: (contractId) => contractsService.settle(contractId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useDisputeContract() {
  const qc = useQueryClient();
  return useMutation<ContractResponse, Error, string>({
    mutationFn: (contractId) => contractsService.dispute(contractId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}
