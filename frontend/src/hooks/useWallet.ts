import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService, type WalletBalance, type AddFundsResponse } from "@/services/walletService";
import { getAccessToken } from "@/services/apiClient";

/* ── Query keys ──────────────────────────────────────── */

export const walletKeys = {
  all: ["wallet"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
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

export function useAddFunds() {
  const qc = useQueryClient();
  return useMutation<AddFundsResponse, Error, number>({
    mutationFn: (amount) => walletService.addFunds(amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
