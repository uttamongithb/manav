"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { getApiBaseUrl } from "@/app/lib/api-base";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  authToken: string | null;
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CACHE_KEY = "INSAAN-user-cache";
const AUTH_TOKEN_KEY = "INSAAN-auth-token";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const login = useCallback((nextUser: AuthUser, token?: string) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(nextUser));
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        setAuthToken(token);
      }
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authToken) return;
    try {
      const backendUrl = getApiBaseUrl();
      const res = await fetch(`${backendUrl}/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const profile = await res.json();
        const updatedUser: AuthUser = {
          id: user?.id || "",
          email: user?.email || "",
          username: user?.username || "",
          displayName: profile.name || user?.displayName || "",
          role: profile.role || user?.role || "",
          avatarUrl: profile.avatarUrl || user?.avatarUrl,
        };
        setUser(updatedUser);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.warn("User refresh failed:", err);
    }
  }, [authToken, user]);

  // Intercept fetch to handle 401s globally
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        let url = "";
        if (typeof args[0] === "string") {
          url = args[0];
        } else if (args[0] instanceof Request) {
          url = args[0].url;
        } else if (args[0] instanceof URL) {
          url = args[0].href;
        }
        
        const backendUrl = getApiBaseUrl();
        if (url.startsWith(backendUrl)) {
          logout();
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = () => {
      if (typeof window === "undefined") {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const cachedUser = localStorage.getItem(USER_CACHE_KEY);
        const token = localStorage.getItem(AUTH_TOKEN_KEY);

        const hasJwtShape = typeof token === "string" && token.split(".").length === 3;

        if (cachedUser && hasJwtShape) {
          const userData = JSON.parse(cachedUser) as AuthUser;
          setUser(userData);
          setAuthToken(token);
        } else if (cachedUser || token) {
          localStorage.removeItem(USER_CACHE_KEY);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setUser(null);
          setAuthToken(null);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setUser(null);
        setAuthToken(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    authToken,
    isLoadingAuth,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

