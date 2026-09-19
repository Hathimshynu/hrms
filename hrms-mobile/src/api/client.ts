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

// Never log this value - see CLAUDE.mobile.md ("never store sensitive
// credentials insecurely") and the root security rules.
export function setAuthToken(token: string | null) {
  currentToken = token;
}

api.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

// Registered by AuthProvider at startup - kept as callbacks (not direct
// imports of the auth layer) to avoid a circular dependency between the
// API client and AuthProvider, which itself needs the API client.
let unauthorizedHandler: (() => void) | null = null;
let tokenRefreshedHandler: ((token: string) => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function setTokenRefreshedHandler(handler: ((token: string) => void) | null) {
  tokenRefreshedHandler = handler;
}

const AUTH_EXEMPT_PATHS = ["/login", "/google-login", "/refresh", "/logout"];

function isAuthExempt(url?: string): boolean {
  if (!url) return false;
  return AUTH_EXEMPT_PATHS.some((path) => url.startsWith(path));
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ success: boolean; data: { access_token: string } }>("/refresh")
      .then((res) => {
        const newToken = res.data.data.access_token;
        setAuthToken(newToken);
        tokenRefreshedHandler?.(newToken);
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
