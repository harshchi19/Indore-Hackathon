import apiClient from "./apiClient";
import type { UserResponse } from "@/types";

export const userService = {
  async getUserById(userId: string): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>(`/users/${userId}`);
    return data;
  },
};
