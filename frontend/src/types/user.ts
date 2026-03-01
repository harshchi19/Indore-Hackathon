import { UserRole } from "./enums";

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}
