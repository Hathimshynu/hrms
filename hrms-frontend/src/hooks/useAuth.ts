// src/hooks/useAuth.ts
"use client";

import { useRouter } from "next/navigation";

import { LoginPayload } from "../lib/auth/auth.service";
import { useAuthStore } from "../store/auth.store";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, login, logout } =
    useAuthStore();

  const handleLogin = async (payload: LoginPayload) => {
    await login(payload);
    router.push("/dashboard");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
  };
}
