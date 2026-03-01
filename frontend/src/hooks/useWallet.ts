import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService, type WalletBalance, type AddFundsResponse, type WalletTransactionsResponse } from "@/services/walletService";
import { getAccessToken } from "@/services/apiClient";

/* ── Query keys ──────────────────────────────────────── */

export const walletKeys = {
  all: ["wallet"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  transactions: (params?: Record<string, unknown>) =>
    [...walletKeys.all, "transactions", params ?? {}] as const,
};

/* ── Hooks ───────────────────────────────────────────── */

export function useWalletBalance() {
  return useQuery<WalletBalance, Error>({
    queryKey: walletKeys.balance(),
    queryFn: () => walletService.getBalance(),
    staleTime: 10_000,
    enabled: !!getAccessToken(),
  });
}

export function useWalletTransactions(params?: {
  txn_type?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery<WalletTransactionsResponse, Error>({
    queryKey: walletKeys.transactions(params as Record<string, unknown>),
    queryFn: () => walletService.getTransactions(params),
    staleTime: 15_000,
    enabled: !!getAccessToken(),
  });
}

export function useAddFunds() {
  const qc = useQueryClient();
  return useMutation<AddFundsResponse, Error, number>({
    mutationFn: (amount) => walletService.addFunds(amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
