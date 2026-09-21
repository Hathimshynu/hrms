// src/api/auth.service.ts
//
// Matches hrms-backend AuthController exactly (verified against the live
// server during Phase 6, including the new `access_token` field added
// specifically for native clients - see the Phase 6 report for why).
import { api } from "./client";

export interface User {
  id: number;
  name: string;
  email: string;
  must_change_password: boolean;
  roles: string[];
  last_login_ip: string | null;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token?: string; // returned to native clients only (X-Client-Type: mobile)
    expires_in: number;
    provider: string;
    remember_me: boolean;
  };
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>("/login", payload).then((res) => res.data),

  logout: () => api.post("/logout"),

  getMe: () => api.get<User>("/me").then((res) => res.data),

  changePassword: (payload: ChangePasswordPayload) => api.post("/change-password", payload),
};
