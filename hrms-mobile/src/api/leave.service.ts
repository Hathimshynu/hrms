// src/api/leave.service.ts
//
// Employee self-service only. Shapes verified against hrms-backend
// LeaveController; the backend derives the employee from the session and
// calculates the day count, so nothing here computes leave days or balances.
// Reviewer endpoints (/leaves/admin, approve, reject) are intentionally not
// called from this app.
import { api } from "./client";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRecord {
  id: number;
  leave_type: string; // code of a leave policy
  start_date: string; // date cast: "YYYY-MM-DD 00:00:00"
  end_date: string;
  total_days: string | number;
  reason: string | null;
  status: LeaveStatus;
  approved_at: string | null;
  rejection_reason: string | null;
  approver?: { id: number; name: string } | null;
  created_at: string;
}

export interface LeaveTypeOption {
  id: number;
  name: string;
  code: string;
}

export interface LeaveBalanceType {
  leave_type: string;
  name: string;
  configured: boolean; // false: no entitlement is set for this employee/type/year
  allocated: number | null; // null when not configured (never 0)
  used: number; // approved days
  pending: number;
  available: number | null; // allocated - approved; null when not configured
  available_after_pending: number | null;
}

export interface LeaveBalance {
  year: number;
  allocation_configured: boolean;
  types: LeaveBalanceType[];
}

export interface ApplyLeavePayload {
  leave_type: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  reason: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const leaveService = {
  types: () => api.get<Envelope<LeaveTypeOption[]>>("/leaves/types").then((r) => r.data.data),

  balance: (year?: number) =>
    api.get<Envelope<LeaveBalance>>("/leaves/balance", { params: { year } }).then((r) => r.data.data),

  list: (params?: { status?: LeaveStatus; page?: number; per_page?: number }) =>
    api.get<Envelope<Paginated<LeaveRecord>>>("/leaves", { params }).then((r) => r.data.data),

  apply: (payload: ApplyLeavePayload) =>
    api.post<Envelope<LeaveRecord>>("/leaves", payload).then((r) => r.data),

  cancel: (id: number) => api.post<Envelope<LeaveRecord>>(`/leaves/${id}/cancel`).then((r) => r.data),
};

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
