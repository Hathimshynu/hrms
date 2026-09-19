// src/lib/designations/designation.service.ts
import { api } from "../api/axios";
import type { DepartmentDto } from "../departments/department.service";

// Exact shape returned by hrms-backend DesignationController (raw model,
// `department` relation eager-loaded). No employee count in this
// response - see AddDesignation.tsx / designations/page.tsx.
export interface DesignationDto {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department: DepartmentDto | null;
  level: "Entry" | "Mid" | "Senior" | "Lead" | "Manager";
  status: "Active" | "Inactive" | "Under Review";
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DesignationPayload {
  name: string;
  code: string;
  department_id: number;
  level: DesignationDto["level"];
  status: DesignationDto["status"];
  description?: string | null;
}

interface DesignationListResponse {
  success: boolean;
  data: DesignationDto[];
}

interface DesignationMutationResponse {
  success: boolean;
  message: string;
  data: DesignationDto;
}

interface DesignationDeleteResponse {
  success: boolean;
  message: string;
}

export const designationService = {
  list: (params?: { search?: string; department_id?: number; status?: string }) =>
    api
      .get<DesignationListResponse>("/designations", { params })
      .then((res) => res.data.data),

  create: (payload: DesignationPayload) =>
    api
      .post<DesignationMutationResponse>("/designations", payload)
      .then((res) => res.data),

  update: (id: number, payload: DesignationPayload) =>
    api
      .put<DesignationMutationResponse>(`/designations/${id}`, payload)
      .then((res) => res.data),

  remove: (id: number) =>
    api.delete<DesignationDeleteResponse>(`/designations/${id}`).then((res) => res.data),
};
