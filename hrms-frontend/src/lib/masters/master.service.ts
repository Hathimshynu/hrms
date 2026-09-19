// src/lib/masters/master.service.ts
//
// Shared client factory for the "employee master" resources exposed by
// hrms-backend EmployeeMasterController under /api/employee-masters/<slug>
// (see routes/api.php "Employee Masters" group). Eight of these masters
// (leave-policies, attendance-policies, work-schedules, shifts,
// weekly-offs, late-policies, overtime-policies, onboarding-checklists)
// share the exact same envelope and base fields:
//   - GET  <slug>       -> { success, data: T[] }
//   - POST <slug>       -> { success, message, data: T }   (201)
//   - PUT  <slug>/{id}  -> { success, message, data: T }
//   - DELETE <slug>/{id}-> { success, message }
//   - base fields: name (required, max 150), code (required, max 50),
//     description (nullable), is_active (nullable boolean, default true)
// (see EmployeeMasterController@masterList/masterCreate/masterUpdate/masterDelete).
// Per-master extra fields (start_time, days, grace_minutes, ...) are
// layered on top by each master's own service file in this directory.
//
// IMPORTANT backend behavior: GET always filters `is_active = true`
// server-side (masterList() hardcodes ->where('is_active', true)) -
// there is no API to list or reactivate an inactive record. Do not add a
// "show inactive" toggle for these lists; it would silently return
// nothing extra and mislead the user.
import { api } from "../api/axios";

export interface BaseMasterDto {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BaseMasterPayload {
  name: string;
  code: string;
  description?: string | null;
  is_active?: boolean;
}

interface MasterListResponse<TDto> {
  success: boolean;
  data: TDto[];
}

interface MasterMutationResponse<TDto> {
  success: boolean;
  message: string;
  data: TDto;
}

interface MasterDeleteResponse {
  success: boolean;
  message: string;
}

export interface MasterService<
  TDto extends BaseMasterDto,
  TPayload extends BaseMasterPayload,
> {
  list: () => Promise<TDto[]>;
  create: (payload: TPayload) => Promise<MasterMutationResponse<TDto>>;
  update: (id: number, payload: TPayload) => Promise<MasterMutationResponse<TDto>>;
  remove: (id: number) => Promise<MasterDeleteResponse>;
}

export function createMasterService<
  TDto extends BaseMasterDto,
  TPayload extends BaseMasterPayload,
>(slug: string): MasterService<TDto, TPayload> {
  const basePath = `/employee-masters/${slug}`;

  return {
    list: () =>
      api.get<MasterListResponse<TDto>>(basePath).then((res) => res.data.data),

    create: (payload: TPayload) =>
      api.post<MasterMutationResponse<TDto>>(basePath, payload).then((res) => res.data),

    update: (id: number, payload: TPayload) =>
      api
        .put<MasterMutationResponse<TDto>>(`${basePath}/${id}`, payload)
        .then((res) => res.data),

    remove: (id: number) =>
      api.delete<MasterDeleteResponse>(`${basePath}/${id}`).then((res) => res.data),
  };
}
