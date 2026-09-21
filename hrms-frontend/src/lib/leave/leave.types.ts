// src/lib/leave/leave.types.ts
//
// Shapes verified against hrms-backend LeaveController and the existing
// `leave_requests` table. Statuses are the table's lowercase enum values.

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveEmployee {
  id: number;
  employee_code: string | null;
  first_name: string;
  last_name: string;
  department_id: number | null;
  department?: { id: number; name: string } | null;
}

export interface LeaveRecord {
  id: number;
  employee_id: number;
  leave_type: string; // code of a leave policy
  start_date: string; // date cast: "YYYY-MM-DD 00:00:00"
  end_date: string;
  total_days: string | number;
  reason: string | null;
  status: LeaveStatus;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  employee?: LeaveEmployee;
  approver?: { id: number; name: string } | null;
}

export interface LeaveTypeOption {
  id: number;
  name: string;
  code: string;
}

export interface LeaveBalanceType {
  leave_type: string;
  name: string;
  // false = no entitlement has been configured for this employee/type/year;
  // allocated and available are then null (never 0).
  configured: boolean;
  allocated: number | null;
  // Approved days (kept as `used` for backward compatibility).
  used: number;
  pending: number;
  // allocated - approved; null when not configured.
  available: number | null;
  // allocated - approved - pending; null when not configured.
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

export interface LeaveListParams {
  status?: LeaveStatus;
  leave_type?: string;
  employee_id?: number;
  department_id?: number;
  from_date?: string;
  to_date?: string;
  per_page?: number;
  page?: number;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
