// src/lib/reports/reports.service.ts
//
// Shapes verified against hrms-backend ReportsController / ReportService.
// Every figure is computed on the server from real data; payroll keys are
// simply absent for users without `view payroll`.
import { api } from "../api/axios";

export type ReportTab =
  | "overview"
  | "workforce"
  | "attendance"
  | "absence"
  | "leave"
  | "payroll"
  | "departments"
  | "monthly";

export interface ReportFilters {
  from_date?: string;
  to_date?: string;
  period?: string; // YYYY-MM (monthly)
  month?: number; // payroll
  year?: number; // payroll
  department_id?: number;
  employee_id?: number;
  status?: string;
  leave_type?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DayCounts {
  present: number;
  absent: number;
  leave: number;
  weekly_off: number;
  upcoming: number;
}

export interface PayrollTotals {
  records: number;
  basic_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
}

export interface LeaveSummary {
  total_requests: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  approved_days: number;
}

export interface AttendanceSummary extends DayCounts {
  attendance_percentage: number | null;
  pending_leave_days: number;
  late_days: number;
  half_days: number;
  employees: number;
}

export interface WorkforceTotals {
  employees: number;
  active: number;
  inactive: number;
  joined_in_period: number;
}

export interface SummaryReport {
  from_date: string;
  to_date: string;
  employees: WorkforceTotals;
  attendance: AttendanceSummary;
  absence: { absent: number; pending_leave_days: number };
  leave: LeaveSummary;
  payroll?: PayrollTotals;
  includes_payroll: boolean;
  unavailable: Record<string, string>;
}

export interface CountRow {
  label: string;
  total: number;
  active?: number;
}

export interface WorkforceReport {
  from_date: string;
  to_date: string;
  totals: WorkforceTotals;
  by_status: CountRow[];
  by_department: { id: number | null; name: string; total: number; active: number }[];
  by_designation: CountRow[];
  by_gender: CountRow[];
  by_employment_type: CountRow[];
  by_work_mode: CountRow[];
  joining_trend: { month: string; joiners: number }[];
  unavailable: Record<string, string>;
}

export interface AttendanceEmployeeRow extends DayCounts {
  employee_id: number;
  employee_code: string | null;
  name: string;
  department: string | null;
  pending_leave_days: number;
  attendance_percentage: number | null;
}

export interface AttendanceReport {
  from_date: string;
  to_date: string;
  summary: AttendanceSummary;
  regularizations: { pending: number; approved: number; rejected: number; cancelled: number };
  daily: ({ date: string } & DayCounts)[];
  by_department: ({ name: string; attendance_percentage: number | null } & DayCounts)[];
  employees: Paginated<AttendanceEmployeeRow>;
  unavailable: Record<string, string>;
}

export interface LeaveEmployeeRow {
  employee_id: number;
  employee_code: string | null;
  name: string;
  department: string | null;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  approved_days: number;
}

export interface LeaveReport {
  from_date: string;
  to_date: string;
  summary: LeaveSummary;
  by_type: { code: string; name: string; total: number; approved: number; approved_days: number }[];
  by_department: { name: string; total: number; approved: number; approved_days: number }[];
  monthly: { month: string; pending: number; approved: number; rejected: number; cancelled: number; approved_days: number }[];
  employees: Paginated<LeaveEmployeeRow>;
  unavailable: Record<string, string>;
  note: string;
}

export interface PayrollEmployeeRow extends PayrollTotals {
  employee_id: number;
  employee_code: string | null;
  name: string;
  department: string | null;
}

export interface PayrollReport {
  totals: PayrollTotals;
  by_month: ({ year: number; month: number; label: string } & PayrollTotals)[];
  by_department: ({ name: string } & PayrollTotals)[];
  by_status: ({ status: string } & PayrollTotals)[];
  employees: Paginated<PayrollEmployeeRow>;
  note: string;
}

export interface DepartmentRow {
  id: number;
  name: string;
  employees: number;
  active_employees: number;
  present: number;
  absent: number;
  leave_days_attendance: number;
  weekly_off: number;
  attendance_percentage: number | null;
  approved_leave_days: number;
  payroll_gross?: number;
  payroll_deductions?: number;
  payroll_net?: number;
}

export interface DepartmentsReport {
  from_date: string;
  to_date: string;
  departments: DepartmentRow[];
  includes_payroll: boolean;
  note: string;
}

export interface MonthlyReport {
  period: string;
  from_date: string;
  to_date: string;
  workforce: { active_employees: number; new_joiners: number; opening_workforce: number | null };
  attendance: AttendanceSummary;
  leave: LeaveSummary;
  departments: DepartmentRow[];
  payroll?: PayrollTotals;
  includes_payroll: boolean;
  unavailable: Record<string, string>;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

const get = <T>(path: string, filters: ReportFilters, signal?: AbortSignal) =>
  api
    .get<Envelope<T>>(`/reports/${path}`, {
      params: Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")),
      signal,
    })
    .then((r) => r.data.data);

export const reportsService = {
  summary: (f: ReportFilters, signal?: AbortSignal) => get<SummaryReport>("summary", f, signal),
  workforce: (f: ReportFilters, signal?: AbortSignal) => get<WorkforceReport>("workforce", f, signal),
  attendance: (f: ReportFilters, signal?: AbortSignal) => get<AttendanceReport>("attendance", f, signal),
  absence: (f: ReportFilters, signal?: AbortSignal) => get<AttendanceReport>("absence", f, signal),
  leave: (f: ReportFilters, signal?: AbortSignal) => get<LeaveReport>("leave", f, signal),
  payroll: (f: ReportFilters, signal?: AbortSignal) => get<PayrollReport>("payroll", f, signal),
  departments: (f: ReportFilters, signal?: AbortSignal) => get<DepartmentsReport>("departments", f, signal),
  monthly: (f: ReportFilters, signal?: AbortSignal) => get<MonthlyReport>("monthly", f, signal),
};

/** "2026-09" -> "Sep 2026" (labels only; no date parsing, so no timezone shift). */
export function monthKeyLabel(key: string): string {
  const [y, m] = key.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(m) - 1] ?? m} ${y}`;
}

export const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v}%`);
