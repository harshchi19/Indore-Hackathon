import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";
import { getAccessToken, clearTokens } from "@/services/apiClient";
import type { UserResponse } from "@/types";

/* ── Context shape ───────────────────────────────────── */

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    role?: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ── Provider ────────────────────────────────────────── */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.getCurrentUser();
      setUser(me);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  // On mount, hydrate user if a token exists
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await authService.login({ email, password });
    await refreshUser();
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    role = "consumer",
  ) => {
    await authService.register({
      email,
      password,
      full_name: fullName,
      role: role as any,
    });
    // Auto-login after registration
    await login(email, password);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ── Hook ────────────────────────────────────────────── */

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
