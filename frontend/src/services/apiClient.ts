import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

/* ── Axios instance ──────────────────────────────────── */

const apiClient = axios.create({
  // Use a relative base so requests route through the Vite proxy in dev
  // (localhost:8080/api/v1 → localhost:8000/api/v1).
  // Set VITE_API_BASE_URL to an absolute URL only for production / Docker.
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

/* ── Token helpers ───────────────────────────────────── */

const TOKEN_KEY = "verdant_access_token";
const REFRESH_KEY = "verdant_refresh_token";

export const getAccessToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_KEY);

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

/* ── Request interceptor — attach JWT ────────────────── */

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ── Response interceptor — refresh on 401 ───────────── */

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip refresh for login/register/refresh endpoints
    const skipUrls = ["/auth/login", "/auth/register", "/auth/refresh"];
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipUrls.some((u) => originalRequest.url?.includes(u))
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
        );
        setTokens(data.access_token, data.refresh_token);
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
