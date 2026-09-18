// src/lib/auth/auth.service.ts

import { api } from "../api/axios";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "hr" | "manager" | "employee";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>("/login", payload).then((res) => res.data),

  logout: () => api.post("/logout"),

  getMe: () => api.get<User>("/auth/me").then((res) => res.data),
};
