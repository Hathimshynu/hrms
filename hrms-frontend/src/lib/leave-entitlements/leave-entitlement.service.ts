// src/lib/leave-entitlements/leave-entitlement.service.ts
//
// /api/leave-entitlements (LeaveEntitlementController). Manual allocation per
// employee + leave type + calendar year. approved/pending are derived by the
// backend from leave requests; remaining = entitled - approved.
import { api } from "../api/axios";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface LeaveEntitlementRow {
  id: number;
  employee_id: number;
  employee_code: string | null;
  employee_name: string;
  department_id: number | null;
  department: string | null;
  leave_policy_id: number;
  leave_type: string | null;
  leave_type_name: string | null;
  leave_year: number;
  entitled_days: number;
  approved_days: number;
  pending_days: number;
  remaining_days: number;
  available_after_pending_days: number;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface LeaveEntitlementParams {
  employee_id?: number;
  department_id?: number;
  leave_policy_id?: number;
  year?: number;
  search?: string;
  sort_by?: "leave_year" | "entitled_days" | "created_at";
  sort_dir?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export interface LeaveEntitlementOptions {
  employees: { id: number; employee_code: string | null; name: string; department_id: number | null }[];
  departments: { id: number; name: string }[];
  leave_policies: { id: number; name: string; code: string }[];
}

export interface CreateLeaveEntitlementPayload {
  employee_id: number;
  leave_policy_id: number;
  leave_year: number;
  entitled_days: number;
}

export const leaveEntitlementService = {
  list: (params: LeaveEntitlementParams, signal?: AbortSignal) =>
    api
      .get<Envelope<Paginated<LeaveEntitlementRow>>>("/leave-entitlements", { params, signal })
      .then((r) => r.data.data),

  options: () =>
    api.get<Envelope<LeaveEntitlementOptions>>("/leave-entitlements/options").then((r) => r.data.data),

  create: (payload: CreateLeaveEntitlementPayload) =>
    api.post<Envelope<LeaveEntitlementRow>>("/leave-entitlements", payload).then((r) => r.data),

  update: (id: number, entitled_days: number) =>
    api.put<Envelope<LeaveEntitlementRow>>(`/leave-entitlements/${id}`, { entitled_days }).then((r) => r.data),

  remove: (id: number) => api.delete<{ success: boolean; message: string }>(`/leave-entitlements/${id}`).then((r) => r.data),
};
