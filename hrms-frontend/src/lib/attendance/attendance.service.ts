// src/lib/attendance/attendance.service.ts
import { api } from "../api/axios";
import type {
  AdminAttendanceParams,
  AttendanceHistoryParams,
  AttendanceRecord,
  AttendanceRecordWithEmployee,
  AttendanceSummaryResponse,
  CheckInOutPayload,
  PaginatedResponse,
  TimesheetResponse,
} from "./attendance.types";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const attendanceService = {
  // Self-service (own employee record only - resolved server-side from
  // the authenticated user, no id is ever passed).
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

  // Admin/HR scope - requires `edit attendance` (see Phase 5 IDOR fix in
  // routes/api.php); returns/accepts arbitrary employees, not just self.
  adminList: (params?: AdminAttendanceParams) =>
    api
      .get<Envelope<PaginatedResponse<AttendanceRecordWithEmployee>>>("/attendance", { params })
      .then((r) => r.data.data),

  summary: (date?: string) =>
    api
      .get<Envelope<AttendanceSummaryResponse>>("/attendance/summary", { params: { date } })
      .then((r) => r.data.data),

  employeeAttendance: (employeeId: number, params?: AttendanceHistoryParams) =>
    api
      .get<Envelope<PaginatedResponse<AttendanceRecord>>>(`/attendance/employee/${employeeId}`, {
        params,
      })
      .then((r) => r.data.data),

  show: (id: number) =>
    api.get<Envelope<AttendanceRecordWithEmployee>>(`/attendance/${id}`).then((r) => r.data.data),
};
