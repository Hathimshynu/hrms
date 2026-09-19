// src/lib/permissions/permission.service.ts
//
// GET/POST/PUT/DELETE /api/permissions* require the `manage permissions`
// permission (hrms-backend PermissionController / routes/api.php). Used by
// the /access-control/permissions admin list and the
// /access-control/roles/[id]/permissions assignment screen (grouped()).
import { api } from "../api/axios";

export interface PermissionDto {
  id: number;
  name: string;
  module: string;
  action: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PermissionPayload {
  name: string;
  module: string;
  action: string;
}

export interface PermissionGroup {
  module: string;
  permissions: PermissionDto[];
}

interface PaginatedPermissions {
  current_page: number;
  data: PermissionDto[];
  last_page: number;
  per_page: number;
  total: number;
}

interface PermissionListResponse {
  success: boolean;
  data: PaginatedPermissions;
}

interface PermissionGroupedResponse {
  success: boolean;
  data: PermissionGroup[];
}

interface PermissionModulesResponse {
  success: boolean;
  data: string[];
}

interface PermissionMutationResponse {
  success: boolean;
  message: string;
  data: PermissionDto;
}

interface PermissionDeleteResponse {
  success: boolean;
  message: string;
}

export const permissionService = {
  // Permissions are paginated server-side (default 100/page, max 100) -
  // request the max so the admin list isn't silently truncated (catalog
  // is small/finite - real module+action combinations).
  list: (params?: { search?: string; module?: string; per_page?: number }) =>
    api
      .get<PermissionListResponse>("/permissions", {
        params: { per_page: 100, ...params },
      })
      .then((res) => res.data.data.data),

  // Full permission catalog grouped by module - used by the Role permission
  // assignment screen's grouped card layout (GET /api/permissions/grouped).
  grouped: () =>
    api
      .get<PermissionGroupedResponse>("/permissions/grouped")
      .then((res) => res.data.data),

  modules: () =>
    api
      .get<PermissionModulesResponse>("/permissions/modules")
      .then((res) => res.data.data),

  create: (payload: PermissionPayload) =>
    api.post<PermissionMutationResponse>("/permissions", payload).then((res) => res.data),

  update: (id: number, payload: PermissionPayload) =>
    api.put<PermissionMutationResponse>(`/permissions/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    api.delete<PermissionDeleteResponse>(`/permissions/${id}`).then((res) => res.data),
};
