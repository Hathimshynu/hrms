// src/lib/users/user.service.ts
//
// Wraps GET/POST/PUT/DELETE /api/users (UserController). `index`, `show`,
// `update` and `destroy` were added to the backend in this same phase -
// previously only `store` existed (used by employee onboarding Step 3).
// This service is for the standalone "Users" (Access Control) admin
// screen, not onboarding - see src/lib/roles/role.service.ts for the
// existing role list used to populate the role dropdown here.
import { api } from "../api/axios";

export interface UserDto {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  role: { id: number; name: string } | null;
  roles: string[]; // legacy array form, same info as `role.name`
  // Only present when the backend eager-loads the relation (index/show) -
  // a linked Employee record if one exists.
  employee: { id: number; employee_code: string; name: string } | null;
  last_login_ip: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListParams {
  search?: string;
  role_id?: number;
  is_active?: boolean;
  per_page?: number;
}

export interface PaginatedUsers {
  current_page: number;
  data: UserDto[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role_id: number;
}

// All fields optional/`sometimes` server-side - only send what changed.
// Leave password/password_confirmation out entirely to keep the current
// password.
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  role_id?: number;
  is_active?: boolean;
}

interface UserListResponse {
  success: boolean;
  data: PaginatedUsers;
}

interface UserMutationResponse {
  success: boolean;
  message: string;
  data: UserDto;
}

interface UserDeleteResponse {
  success: boolean;
  message: string;
}

export const userService = {
  // Users are paginated server-side (default 20/page, max 100) - request
  // the max so the admin list isn't silently truncated, same approach as
  // roleService.list().
  list: (params?: UserListParams) =>
    api
      .get<UserListResponse>("/users", { params: { per_page: 100, ...params } })
      .then((res) => res.data.data),

  create: (payload: CreateUserPayload) =>
    api.post<UserMutationResponse>("/users", payload).then((res) => res.data),

  update: (id: number, payload: UpdateUserPayload) =>
    api.put<UserMutationResponse>(`/users/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    api.delete<UserDeleteResponse>(`/users/${id}`).then((res) => res.data),
};
