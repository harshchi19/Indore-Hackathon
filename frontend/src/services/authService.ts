import apiClient, { setTokens, clearTokens } from "./apiClient";
import type {
  UserRegisterRequest,
  UserLoginRequest,
  TokenPair,
  UserResponse,
} from "@/types";

export const authService = {
  async register(payload: UserRegisterRequest): Promise<UserResponse> {
    const { data } = await apiClient.post<UserResponse>("/auth/register", payload);
    return data;
  },

  async login(payload: UserLoginRequest): Promise<TokenPair> {
    const { data } = await apiClient.post<TokenPair>("/auth/login", payload);
    setTokens(data.access_token, data.refresh_token);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const { data } = await apiClient.post<TokenPair>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    setTokens(data.access_token, data.refresh_token);
    return data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>("/auth/me");
    return data;
  },

  logout() {
    clearTokens();
  },
};
