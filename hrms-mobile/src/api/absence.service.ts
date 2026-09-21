// src/api/absence.service.ts
//
// Absence is derived by the backend (attendance + weekly offs + approved
// leave and the active holiday calendar); the app only displays it.
import { api } from "./client";

export type AbsenceStatus = "present" | "absent" | "leave" | "weekly_off" | "holiday" | "upcoming";

export interface AbsenceSummary {
  present: number;
  absent: number;
  leave: number;
  weekly_off: number;
  holiday: number;
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
  holiday: "Holiday",
  upcoming: "Upcoming",
};

export const absenceService = {
  mine: (params: { from_date: string; to_date: string }) =>
    api
      .get<{ success: boolean; data: AbsenceResponse }>("/attendance/absence", { params })
      .then((r) => r.data.data),
};
