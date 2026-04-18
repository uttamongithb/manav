"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

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
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const login = useCallback((nextUser: AuthUser, token?: string) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(nextUser));
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      }
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

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
        } else if (cachedUser || token) {
          localStorage.removeItem(USER_CACHE_KEY);
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoadingAuth,
    isAuthenticated: !!user,
    login,
    logout,
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

