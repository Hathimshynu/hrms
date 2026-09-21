// src/lib/payroll/payroll.service.ts
//
// Shapes verified against hrms-backend PayrollController and the existing
// `payrolls` table. Payroll responses never include bank details.
import { api } from "../api/axios";

export type PayrollStatus = "draft" | "processed";

export interface PayrollEmployee {
  id: number;
  employee_code: string | null;
  first_name: string;
  last_name: string;
  department?: { id: number; name: string } | null;
}

export interface PayrollRecord {
  id: number;
  employee_id: number;
  payroll_month: number;
  payroll_year: number;
  basic_salary: string;
  gross_salary: string;
  total_deductions: string;
  net_salary: string;
  status: PayrollStatus;
  processed_at: string | null;
  created_at: string;
  employee?: PayrollEmployee;
}

export interface PayrollSummary {
  records: number;
  basic_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PayrollListParams {
  search?: string;
  month?: number;
  year?: number;
  employee_id?: number;
  department_id?: number;
  status?: PayrollStatus;
  per_page?: number;
  page?: number;
}

export interface PayrollPreview {
  employee_id: number;
  payroll_month: number;
  payroll_year: number;
  basic_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  breakdown: { earnings: Record<string, number>; deductions: Record<string, number> };
  source: { compensation_id: number; salary_type: string; effective_from: string | null; notes: string[] };
  employee: { id: number; employee_code: string | null; name: string };
  existing: number | null;
}

export interface PayrollKey {
  employee_id: number;
  payroll_month: number;
  payroll_year: number;
}

export interface UpdatePayrollPayload {
  recalculate?: boolean;
  basic_salary?: number;
  gross_salary?: number;
  total_deductions?: number;
}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const payrollService = {
  list: (params?: PayrollListParams) =>
    api
      .get<Envelope<{ summary: PayrollSummary; payrolls: Paginated<PayrollRecord> }>>("/payrolls", { params })
      .then((r) => r.data.data),

  preview: (params: PayrollKey) =>
    api.get<Envelope<PayrollPreview>>("/payrolls/preview", { params }).then((r) => r.data.data),

  create: (payload: PayrollKey) =>
    api.post<Envelope<PayrollRecord>>("/payrolls", payload).then((r) => r.data),

  update: (id: number, payload: UpdatePayrollPayload) =>
    api.put<Envelope<PayrollRecord>>(`/payrolls/${id}`, payload).then((r) => r.data),

  process: (id: number) => api.post<Envelope<PayrollRecord>>(`/payrolls/${id}/process`).then((r) => r.data),

  remove: (id: number) => api.delete<Envelope<null>>(`/payrolls/${id}`).then((r) => r.data),
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_OPTIONS = MONTHS.map((label, i) => ({ label, value: String(i + 1) }));

export function monthLabel(month: number, year: number): string {
  return `${MONTHS[month - 1] ?? month} ${year}`;
}

const money = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Amount with Indian digit grouping; the schema stores no currency, so none is shown. */
export function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? money.format(n) : "—";
}
