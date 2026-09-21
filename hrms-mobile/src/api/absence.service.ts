// src/api/absence.service.ts
//
// Absence is derived by the backend (attendance + weekly offs + approved
// leave); the app only displays it. Holidays are not in the schema.
import { api } from "./client";

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

export interface AbsenceResponse {
  from_date: string;
  to_date: string;
  holiday_supported: boolean;
  summary: AbsenceSummary;
  days: AbsenceDay[];
}

export const ABSENCE_LABELS: Record<AbsenceStatus, string> = {
  present: "Present",
  absent: "Absent",
  leave: "On Leave",
  weekly_off: "Week Off",
  upcoming: "Upcoming",
};

export const absenceService = {
  mine: (params: { from_date: string; to_date: string }) =>
    api
      .get<{ success: boolean; data: AbsenceResponse }>("/attendance/absence", { params })
      .then((r) => r.data.data),
};
