// src/lib/attendance/absence.service.ts
//
// Absence is derived server-side (AbsenceCalculationService); nothing is
// stored. Holidays are not represented in the schema, so there is no
// "holiday" status.
import { api } from "../api/axios";
import type { Paginated } from "../leave/leave.types";

export type AbsenceStatus = "present" | "absent" | "leave" | "weekly_off" | "upcoming";

export interface AbsenceSummary {
  present: number;
  absent: number;
  leave: number;
  weekly_off: number;
  upcoming: number;
}

export interface AbsenceDay {
  date: string; // YYYY-MM-DD
  status: AbsenceStatus;
  pending_leave: boolean;
}

export interface AbsenceSelfResponse {
  employee: { id: number; employee_code: string | null; name: string };
  from_date: string;
  to_date: string;
  holiday_supported: boolean;
  summary: AbsenceSummary;
  days: AbsenceDay[];
}

export interface AbsenceAdminRow extends AbsenceDay {
  employee_id: number;
  employee: { id: number; employee_code: string | null; name: string };
  department: string | null;
}

export interface AbsenceAdminResponse {
  from_date: string;
  to_date: string;
  status: AbsenceStatus;
  holiday_supported: boolean;
  summary: AbsenceSummary;
  rows: Paginated<AbsenceAdminRow>;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export interface AbsenceParams {
  from_date?: string;
  to_date?: string;
  status?: AbsenceStatus;
  employee_id?: number;
  department_id?: number;
  per_page?: number;
  page?: number;
}

export const absenceService = {
  mine: (params?: Pick<AbsenceParams, "from_date" | "to_date">) =>
    api.get<Envelope<AbsenceSelfResponse>>("/attendance/absence", { params }).then((r) => r.data.data),

  adminList: (params?: AbsenceParams) =>
    api.get<Envelope<AbsenceAdminResponse>>("/attendance/absence/admin", { params }).then((r) => r.data.data),
};

export const ABSENCE_LABELS: Record<AbsenceStatus, string> = {
  present: "Present",
  absent: "Absent",
  leave: "On Leave",
  weekly_off: "Week Off",
  upcoming: "Upcoming",
};
