// src/lib/departments/department.service.ts
import { api } from "../api/axios";

// Exact shape returned by hrms-backend DepartmentController (no Resource
// class - the raw Eloquent model is serialized). There is no employee
// count or head name/avatar in this response - see AddDepartment.tsx /
// departments/page.tsx for how that gap is handled.
export interface DepartmentDto {
  id: number;
  name: string;
  code: string;
  head_id: number | null;
  status: "Active" | "Inactive" | "Under Review";
  type: "Technical" | "Non-Technical" | "Administrative";
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DepartmentPayload {
  name: string;
  code: string;
  status: DepartmentDto["status"];
  type: DepartmentDto["type"];
  description?: string | null;
}

interface DepartmentListResponse {
  success: boolean;
  data: DepartmentDto[];
}

interface DepartmentMutationResponse {
  success: boolean;
  message: string;
  data: DepartmentDto;
}

interface DepartmentDeleteResponse {
  success: boolean;
  message: string;
}

export const departmentService = {
  list: (params?: { search?: string; status?: string }) =>
    api
      .get<DepartmentListResponse>("/departments", { params })
      .then((res) => res.data.data),

  create: (payload: DepartmentPayload) =>
    api
      .post<DepartmentMutationResponse>("/departments", payload)
      .then((res) => res.data),

  update: (id: number, payload: DepartmentPayload) =>
    api
      .put<DepartmentMutationResponse>(`/departments/${id}`, payload)
      .then((res) => res.data),

  remove: (id: number) =>
    api.delete<DepartmentDeleteResponse>(`/departments/${id}`).then((res) => res.data),
};
