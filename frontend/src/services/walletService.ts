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
};
