// src/auth/AuthProvider.tsx
import * as React from "react";

import { authService, type LoginPayload, type User } from "../api/auth.service";
import { setAuthToken, setRefreshToken, setTokenRefreshedHandler, setUnauthorizedHandler } from "../api/client";
import { parseApiError } from "../api/errors";
import { refreshTokenStorage, tokenStorage } from "../storage/secureStorage";
import type { AuthContextValue } from "./auth.types";

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const clearSession = React.useCallback(() => {
    setAuthToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    tokenStorage.clear().catch(() => {});
    refreshTokenStorage.clear().catch(() => {});
  }, []);

  // Wire the API client's 401/refresh callbacks once. Kept as callbacks
  // (not a store import) to avoid a circular dependency with the API layer.
  React.useEffect(() => {
    setUnauthorizedHandler(clearSession);
    setTokenRefreshedHandler((token, refreshToken) => {
      tokenStorage.set(token).catch(() => {});
      if (refreshToken) refreshTokenStorage.set(refreshToken).catch(() => {});
    });
    return () => {
      setUnauthorizedHandler(null);
      setTokenRefreshedHandler(null);
    };
  }, [clearSession]);

  const refreshUser = React.useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setIsAuthenticated(true);
      return currentUser;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  // Session restoration: a stored token means a previous login - verify it
  // is still valid against the backend rather than trusting it blindly.
  React.useEffect(() => {
    let active = true;

    (async () => {
      const storedToken = await tokenStorage.get().catch(() => null);
      const storedRefresh = await refreshTokenStorage.get().catch(() => null);

      if (!storedToken && !storedRefresh) {
        if (active) setIsInitializing(false);
        return;
      }

      // An expired access token is fine here: the first 401 triggers a silent refresh.
      setAuthToken(storedToken);
      setRefreshToken(storedRefresh);
      await refreshUser();
      if (active) setIsInitializing(false);
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = React.useCallback(async (payload: LoginPayload): Promise<User> => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const res = await authService.login(payload);
      const { user: loggedInUser, access_token, refresh_token } = res.data;

      await tokenStorage.set(access_token);
      if (refresh_token) {
        await refreshTokenStorage.set(refresh_token);
        setRefreshToken(refresh_token);
      }
      setAuthToken(access_token);
      setUser(loggedInUser);
      setIsAuthenticated(true);

      return loggedInUser;
    } catch (err) {
      setError(parseApiError(err, "Invalid email or password").message);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // best-effort: clear local session even if the request fails
    }
    clearSession();
  }, [clearSession]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated, isInitializing, isLoggingIn, error, login, logout, refreshUser }),
    [user, isAuthenticated, isInitializing, isLoggingIn, error, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
