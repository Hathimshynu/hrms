// src/api/attendance.service.ts
//
// Self-service attendance only, per Phase 6 scope - the employee mobile
// app does not call the admin-wide endpoints (index/summary/employee/{id}/
// show), which additionally require `edit attendance` (see the Phase 5
// IDOR fix) and are HR/admin surfaces, not employee self-service.
import { api } from "./client";
import type {
  AttendanceHistoryParams,
  AttendanceRecord,
  CheckInOutPayload,
  PaginatedResponse,
  TimesheetResponse,
} from "../attendance/attendance.types";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const attendanceService = {
  today: () =>
    api.get<Envelope<AttendanceRecord | null>>("/attendance/today").then((r) => r.data.data),

  checkIn: (payload: CheckInOutPayload) =>
    api.post<Envelope<AttendanceRecord>>("/attendance/check-in", payload).then((r) => r.data),

  checkOut: (payload: CheckInOutPayload) =>
    api.post<Envelope<AttendanceRecord>>("/attendance/check-out", payload).then((r) => r.data),

  history: (params?: AttendanceHistoryParams) =>
    api
      .get<Envelope<PaginatedResponse<AttendanceRecord>>>("/attendance/history", { params })
      .then((r) => r.data.data),

  calendar: (month: string) =>
    api
      .get<Envelope<AttendanceRecord[]>>("/attendance/calendar", { params: { month } })
      .then((r) => r.data.data),

  timesheet: (month: string) =>
    api
      .get<Envelope<TimesheetResponse>>("/attendance/timesheet", { params: { month } })
      .then((r) => r.data.data),
};
