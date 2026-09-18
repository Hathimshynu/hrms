// src/store/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, LoginPayload, User } from "../lib/auth/auth.service";


interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { user, accessToken } = await authService.login(payload);
          set({ user, accessToken, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err?.response?.data?.message ?? "Invalid email or password",
          });
          throw err;
        }
      },

      logout: () => {
        authService.logout().catch(() => {});
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "hrm-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);