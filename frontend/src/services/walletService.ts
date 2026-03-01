import apiClient from "./apiClient";

export interface WalletBalance {
  user_id: string;
  wallet_balance: number;
  currency: string;
}

export interface AddFundsResponse {
  user_id: string;
  wallet_balance: number;
  amount_added: number;
  currency: string;
}

export interface WalletTransactionItem {
  id: string;
  txn_type: "deposit" | "purchase" | "sale" | "refund" | "withdrawal";
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface WalletTransactionsResponse {
  total: number;
  items: WalletTransactionItem[];
}

export const walletService = {
  async getBalance(): Promise<WalletBalance> {
    const { data } = await apiClient.get<WalletBalance>("/wallet/balance");
    return data;
  },

  async addFunds(amount: number): Promise<AddFundsResponse> {
    const { data } = await apiClient.post<AddFundsResponse>(
      "/wallet/add-funds",
      { amount },
    );
    return data;
  },

  async getTransactions(params?: {
    txn_type?: string;
    skip?: number;
    limit?: number;
  }): Promise<WalletTransactionsResponse> {
    const { data } = await apiClient.get<WalletTransactionsResponse>(
      "/wallet/transactions",
      { params },
    );
    return data;
  },
};
