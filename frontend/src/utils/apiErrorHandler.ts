import { AxiosError } from "axios";
import { QueryClient } from "@tanstack/react-query";

/* ── Error shape returned by FastAPI ─────────────────── */

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
  field?: string;
}

/* ── Parse any error into a uniform ApiError ─────────── */

export function parseApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as
      | { detail?: string | { msg: string }[] }
      | undefined;

    let message = "An unexpected error occurred";
    let detail: string | undefined;

    if (status === 401) {
      message = "Authentication required";
      detail = "Your session has expired. Please log in again.";
    } else if (status === 403) {
      message = "Access denied";
      detail = "You do not have permission to perform this action.";
    } else if (status === 404) {
      message = "Not found";
      detail = "The requested resource does not exist.";
    } else if (status === 422) {
      message = "Validation error";
      if (Array.isArray(data?.detail)) {
        detail = data.detail.map((d) => d.msg).join("; ");
      } else if (typeof data?.detail === "string") {
        detail = data.detail;
      }
    } else if (status === 429) {
      message = "Too many requests";
      detail = "Please wait a moment and try again.";
    } else if (status >= 500) {
      message = "Server error";
      detail = "Something went wrong on our end. Please try again later.";
    } else if (typeof data?.detail === "string") {
      message = data.detail;
    }

    return { status, message, detail };
  }

  if (error instanceof Error) {
    return { status: 0, message: error.message };
  }

  return { status: 0, message: String(error) };
}

/* ── Human-readable message for toast/UI ─────────────── */

export function getErrorMessage(error: unknown): string {
  const parsed = parseApiError(error);
  return parsed.detail ? `${parsed.message}: ${parsed.detail}` : parsed.message;
}

/* ── Check if error is an auth error (401/403) ───────── */

export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
}

/* ── Check if error is a network/timeout issue ───────── */

export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response || error.code === "ECONNABORTED";
  }
  return false;
}

/* ── Global query client error handler (for QueryClient defaults) */

export function createQueryClientConfig() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          // Don't retry auth errors — the interceptor handles refresh
          if (isAuthError(error)) return false;
          // Retry network errors up to 3 times
          if (isNetworkError(error)) return failureCount < 3;
          // Retry server errors once
          if (
            error instanceof AxiosError &&
            (error.response?.status ?? 0) >= 500
          ) {
            return failureCount < 1;
          }
          // Don't retry 4xx
          return false;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
