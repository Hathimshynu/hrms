// src/lib/roles/role.service.ts
//
// /api/roles* requires the `manage roles` permission (hrms-backend
// RoleController / routes/api.php). Originally used only to populate the
// role dropdown when creating a work account during employee onboarding
// (Step 3); Phase 8 extends this with full CRUD + permission-assignment
// for the /access-control/roles admin screens - the original `list()`
// signature/behavior is unchanged so the onboarding call site keeps
// working as-is.
import { api } from "../api/axios";
import type { PermissionDto } from "../permissions/permission.service";

export interface RoleDto {
  id: number;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
  // Present on index/show/store/update/syncPermissions responses - not
  // read by the onboarding dropdown, so left optional.
  permissions_count?: number;
  permissions?: PermissionDto[];
}

export interface RolePayload {
  name: string;
}

interface PaginatedRoles {
  data: RoleDto[];
}

interface RoleListResponse {
  success: boolean;
  data: PaginatedRoles;
}

interface RoleShowResponse {
  success: boolean;
  data: RoleDto;
}

interface RoleMutationResponse {
  success: boolean;
  message: string;
  data: RoleDto;
}

interface RoleDeleteResponse {
  success: boolean;
  message: string;
}

interface RolePermissionsResponse {
  success: boolean;
  data: {
    role: { id: number; name: string };
    permissions: PermissionDto[];
  };
}

export const roleService = {
  // Roles are paginated server-side (default 20/page, max 100) - request
  // the max so the onboarding role dropdown and the Roles admin list
  // aren't silently truncated.
  list: (params?: { search?: string }) =>
    api
      .get<RoleListResponse>("/roles", { params: { per_page: 100, ...params } })
      .then((res) => res.data.data.data),

  get: (id: number) =>
    api.get<RoleShowResponse>(`/roles/${id}`).then((res) => res.data.data),

  create: (payload: RolePayload) =>
    api.post<RoleMutationResponse>("/roles", payload).then((res) => res.data),

  update: (id: number, payload: RolePayload) =>
    api.put<RoleMutationResponse>(`/roles/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    api.delete<RoleDeleteResponse>(`/roles/${id}`).then((res) => res.data),

  // Role's currently-assigned permissions only.
  getPermissions: (roleId: number) =>
    api
      .get<RolePermissionsResponse>(`/roles/${roleId}/permissions`)
      .then((res) => res.data.data),

  // Full replace (sync) of the role's permission set - matches the
  // "select many, save once" UX of the assignment screen.
  syncPermissions: (roleId: number, permissionIds: number[]) =>
    api
      .put<RolePermissionsResponse>(`/roles/${roleId}/permissions`, {
        permission_ids: permissionIds,
      })
      .then((res) => res.data.data),
};
