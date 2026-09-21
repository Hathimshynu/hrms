// src/api/client.ts
//
// Single centralized API client for the whole app (matches
// hrms-frontend/src/lib/api/axios.ts's role, adapted for the mobile auth
// transport - see AuthProvider.tsx for why Bearer tokens are used instead
// of the web's httpOnly cookie).
import axios, { type InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "../constants/config";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

let currentToken: string | null = null;
let currentRefreshToken: string | null = null;

// Never log this value - see CLAUDE.mobile.md ("never store sensitive
// credentials insecurely") and the root security rules.
export function setAuthToken(token: string | null) {
  currentToken = token;
}

// Never log this value either.
export function setRefreshToken(token: string | null) {
  currentRefreshToken = token;
}

api.interceptors.request.use((config) => {
  // Tells the backend this is a native client: it then returns the refresh
  // token in the response body (browsers only ever get an HttpOnly cookie).
  config.headers["X-Client-Type"] = "mobile";
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

// Registered by AuthProvider at startup - kept as callbacks (not direct
// imports of the auth layer) to avoid a circular dependency between the
// API client and AuthProvider, which itself needs the API client.
let unauthorizedHandler: (() => void) | null = null;
let tokenRefreshedHandler: ((token: string, refreshToken: string | null) => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function setTokenRefreshedHandler(
  handler: ((token: string, refreshToken: string | null) => void) | null
) {
  tokenRefreshedHandler = handler;
}

const AUTH_EXEMPT_PATHS = ["/login", "/google-login", "/refresh", "/logout"];

function isAuthExempt(url?: string): boolean {
  if (!url) return false;
  return AUTH_EXEMPT_PATHS.some((path) => url.startsWith(path));
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  // No refresh token (e.g. a session from before refresh tokens existed): nothing to try.
  if (!currentRefreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = api
      .post<{ success: boolean; data: { access_token: string; refresh_token?: string } }>("/refresh", {
        refresh_token: currentRefreshToken,
      })
      .then((res) => {
        const { access_token, refresh_token } = res.data.data;
        setAuthToken(access_token);
        // Rotation: the previous refresh token is now dead, keep the new one.
        if (refresh_token) setRefreshToken(refresh_token);
        tokenRefreshedHandler?.(access_token, refresh_token ?? null);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      err.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthExempt(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const refreshed = await refreshSession();
      if (refreshed) {
        return api(originalRequest);
      }

      unauthorizedHandler?.();
    }

    return Promise.reject(err);
  }
);
