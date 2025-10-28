'use client';

import { apiFetch } from "@/lib/api";
import {
  ApiResponse,
  AuthResponsePayload,
  Role,
  UserProfile,
} from "@/types";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

const STORAGE_KEY = "arcitech_auth_state";

type AuthState = {
  token: string | null;
  user: UserProfile | null;
  expiresAt: number | null;
};

type AuthContextValue = {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSubAdmin: boolean;
  isDeveloper: boolean;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<ApiResponse<AuthResponsePayload>>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<ApiResponse<AuthResponsePayload>>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  token: null,
  user: null,
  expiresAt: null,
};

function readStoredState(): AuthState {
  if (typeof window === "undefined") {
    return initialState;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return initialState;
  }
  try {
    const parsed = JSON.parse(stored) as AuthState;
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse auth state", error);
    window.localStorage.removeItem(STORAGE_KEY);
    return initialState;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(readStoredState);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearLogoutTimer();
    setState(initialState);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [clearLogoutTimer]);

  useEffect(() => {
    clearLogoutTimer();
    if (!state.expiresAt) {
      return;
    }
    const timeout = state.expiresAt - Date.now();
    const timer = setTimeout(() => {
      logout();
    }, Math.max(timeout, 0));
    logoutTimerRef.current = timer;
    return () => {
      clearTimeout(timer);
      if (logoutTimerRef.current === timer) {
        logoutTimerRef.current = null;
      }
    };
  }, [state.expiresAt, logout, clearLogoutTimer]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (state.token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  const handleAuthSuccess = useCallback(
    (payload: AuthResponsePayload) => {
      const expiresAt = Date.now() + payload.expiresInMs;
      const authState: AuthState = {
        token: payload.token,
        user: payload.user,
        expiresAt,
      };
      setState(authState);
      return authState;
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiFetch<AuthResponsePayload>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      handleAuthSuccess(response.data);
      return response;
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const response = await apiFetch<AuthResponsePayload>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password }),
      });
      handleAuthSuccess(response.data);
      return response;
    },
    [handleAuthSuccess]
  );

  const refreshProfile = useCallback(async () => {
    if (!state.token) return;
    try {
      const response = await apiFetch<UserProfile>("/api/users/me", {
        method: "GET",
        token: state.token,
      });
      setState((prev) => ({
        ...prev,
        user: response.data,
      }));
    } catch (error) {
      console.error("Failed to refresh profile", error);
      logout();
    }
  }, [state.token, logout]);

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = Boolean(state.token && state.user);
    const role: Role | null = state.user?.role ?? null;
    const isSuperAdmin = role === "SUPER_ADMIN";
    const isSubAdmin = role === "SUB_ADMIN";
    const isDeveloper = role === "DEVELOPER";
    const isAdmin = isSuperAdmin || isSubAdmin;
    return {
      token: state.token,
      user: state.user,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isSubAdmin,
      isDeveloper,
      loading: false,
      login,
      register,
      logout,
      refreshProfile,
    };
  }, [state, login, register, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
