// src/store/auth.store.ts
import { isAxiosError } from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, GoogleLoginPayload, LoginPayload, User } from "../lib/auth/auth.service";
import { useUserStore } from "./user.store";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<User>;
  googleLogin: (payload: GoogleLoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
      error: null,

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(payload);
          const user = res.data.user;
          set({ user, isAuthenticated: true, isLoading: false });
          return user;
        } catch (err) {
          const message = isAxiosError<{ message?: string }>(err)
            ? err.response?.data?.message
            : undefined;
          set({
            isLoading: false,
            error: message ?? "Invalid email or password",
          });
          throw err;
        }
      },

      googleLogin: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.googleLogin(payload);
          const user = res.data.user;
          set({ user, isAuthenticated: true, isLoading: false });
          return user;
        } catch (err) {
          const message = isAxiosError<{ message?: string }>(err)
            ? err.response?.data?.message
            : undefined;
          set({ isLoading: false, error: message ?? "Google sign-in failed" });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // best-effort: clear local state even if the request fails
        }
        set({ user: null, isAuthenticated: false });
        useUserStore.getState().reset();
      },

      fetchCurrentUser: async () => {
        set({ isInitializing: true });
        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isInitializing: false });
          return user;
        } catch {
          set({ user: null, isAuthenticated: false, isInitializing: false });
          return null;
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
        if (!user) {
          useUserStore.getState().reset();
        }
      },
    }),
    {
      name: "hrm-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
