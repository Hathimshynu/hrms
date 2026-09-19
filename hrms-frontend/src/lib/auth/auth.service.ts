// src/lib/auth/auth.service.ts

import { api } from "../api/axios";

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
    expires_in: number;
    provider: string;
    remember_me: boolean;
  };
}

export interface GoogleLoginPayload {
  id_token: string;
  remember_me?: boolean;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>("/login", payload).then((res) => res.data),

  // Existing backend contract: POST /google-login { id_token, remember_me? }
  // returns the same envelope as /login.
  googleLogin: (payload: GoogleLoginPayload) =>
    api.post<LoginResponse>("/google-login", payload).then((res) => res.data),

  logout: () => api.post("/logout"),

  getMe: () => api.get<User>("/me").then((res) => res.data),

  refresh: () => api.post("/refresh"),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post("/change-password", payload),
};
