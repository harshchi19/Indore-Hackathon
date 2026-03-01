import { UserRole } from "./enums";

/* ── Request ─────────────────────────────────────────── */

export interface UserRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

/* ── Response ────────────────────────────────────────── */

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Generic message response (e.g. { detail: "ok" }) */
export interface MessageResponse {
  detail: string;
}

// UserResponse is defined in user.ts — re-exported via index.ts
