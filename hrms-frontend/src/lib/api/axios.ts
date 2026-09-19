// src/lib/api/axios.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api",
  withCredentials: true,
});

// Endpoints that must never trigger a silent refresh/logout loop.
const AUTH_EXEMPT_PATHS = ["/login", "/google-login", "/refresh", "/logout"];

function isAuthExempt(url?: string): boolean {
  if (!url) return false;
  return AUTH_EXEMPT_PATHS.some((path) => url.startsWith(path));
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/refresh")
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// The JWT lives in an httpOnly cookie set by the Laravel backend; the
// browser attaches it automatically on every request (withCredentials).
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
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

      const { useAuthStore } = await import("@/src/store/auth.store");
      useAuthStore.getState().setUser(null);

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        // Outside React: no router instance is available inside an axios interceptor.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login?expired=1";
      }
    }

    return Promise.reject(err);
  }
);
