// src/lib/employees/employee.service.ts
//
// Wraps GET/PUT/DELETE /api/employees, per EmployeeController. Creation
// goes through the 11-step onboarding flow (onboarding.service.ts), not
// EmployeeController@store - see the Phase 4 report for why.
import { api } from "../api/axios";

export interface EmployeeListItem {
  id: number;
  employee_code: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  department: { id: number; name: string; code: string } | null;
  designation: { id: number; name: string; code: string } | null;
  branch: { id: number; name: string; code: string } | null;
  location: { id: number; name: string; code: string } | null;
  salary: string | number | null;
  joining_date: string | null;
  employment_type: string | null;
  work_mode: string | null;
  lifecycle: string;
  status: string;
  profile_photo: string | null;
  account: {
    user_id: number;
    username: string | null;
    email: string;
    role_id: number;
    access_level: string | null;
    is_active: boolean;
  } | null;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface EmployeeListParams {
  search?: string;
  department_id?: number;
  designation_id?: number;
  branch_id?: number;
  location_id?: number;
  status?: string;
  lifecycle?: string;
  employment_type?: string;
  work_mode?: string;
  sort_by?: string;
  sort_direction?: "asc" | "desc";
  limit?: number;
  page?: number;
}

export interface EmployeeDetail {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  alternate_phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  employment_type: string | null;
  joining_date: string | null;
  probation_end_date: string | null;
  department_id: number | null;
  designation_id: number | null;
  reporting_manager_id: number | null;
  work_mode: string | null;
  work_phone?: string | null;
  employment_level?: string | null;
  employment_status: string;
  lifecycle: string;
  profile_photo: string | null;
  address: string | null;
  salary: string | number | null;
  branch_id: number | null;
  location_id: number | null;
  department: { id: number; name: string; code: string } | null;
  designation: { id: number; name: string; code: string } | null;
  user: {
    id: number;
    name: string;
    email: string;
    username: string | null;
    role_id: number;
    is_active: boolean;
    role?: { id: number; name: string } | null;
  } | null;
}

export interface UpdateEmployeePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  alternate_phone?: string | null;
  employment_type?: string;
  probation_end_date?: string | null;
  joining_date?: string | null;
  department_id?: number | null;
  designation_id?: number | null;
  reporting_manager_id?: number | null;
  work_mode?: string | null;
  employment_status?: string;
}

export const employeeService = {
  list: (params?: EmployeeListParams) =>
    api
      .get<{ success: boolean; data: PaginatedResponse<EmployeeListItem> }>("/employees", {
        params,
      })
      .then((res) => res.data.data),

  show: (id: number) =>
    api
      .get<{ success: boolean; data: EmployeeDetail }>(`/employees/${id}`)
      .then((res) => res.data.data),

  update: (id: number, payload: UpdateEmployeePayload) =>
    api
      .put<{ success: boolean; message: string; data: EmployeeDetail }>(
        `/employees/${id}`,
        payload
      )
      .then((res) => res.data),

  remove: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/employees/${id}`).then((res) => res.data),
};
