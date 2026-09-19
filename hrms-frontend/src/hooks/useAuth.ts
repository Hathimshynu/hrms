// src/hooks/useAuth.ts
"use client";

import { useRouter } from "next/navigation";

import { GoogleLoginPayload, LoginPayload } from "../lib/auth/auth.service";
import { useAuthStore } from "../store/auth.store";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,
    login,
    googleLogin,
    logout,
    fetchCurrentUser,
  } = useAuthStore();

  const handleLogin = async (payload: LoginPayload) => {
    const loggedInUser = await login(payload);
    router.push(loggedInUser.must_change_password ? "/change-password" : "/dashboard");
  };

  const handleGoogleLogin = async (payload: GoogleLoginPayload) => {
    const loggedInUser = await googleLogin(payload);
    router.push(loggedInUser.must_change_password ? "/change-password" : "/dashboard");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,
    login: handleLogin,
    googleLogin: handleGoogleLogin,
    logout: handleLogout,
    fetchCurrentUser,
  };
}
