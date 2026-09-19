// src/attendance/attendance.types.ts
//
// Identical contract to hrms-frontend/src/lib/attendance/attendance.types.ts
// (same backend, verified against the live server in Phase 5/6) - kept in
// sync deliberately rather than sharing a package, since the two apps
// don't currently share a build/module system.

// Exact enum on the `attendances` table (hrms-backend migrations).
export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "Half Day"
  | "On Leave"
  | "Holiday"
  | "Week Off";

export interface AttendanceGeoPoint {
  latitude: string | number | null;
  longitude: string | number | null;
  accuracy: string | number | null;
  distance: number | null;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  attendance_date: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in: AttendanceGeoPoint;
  check_out: AttendanceGeoPoint;
  status: AttendanceStatus;
  work_hours: string | number | null;
  overtime_hours: string | number | null;
  source: string | null;
  device_id: string | null;
  notes: string | null;
}

export interface CheckInOutPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  device_id?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface AttendanceHistoryParams {
  from_date?: string;
  to_date?: string;
  per_page?: number;
  page?: number;
}

export interface TimesheetResponse {
  month: string;
  total_days: number;
  present_days: number;
  late_days: number;
  half_days: number;
  leave_days: number;
  total_work_hours: number;
  total_overtime_hours: number;
  records: AttendanceRecord[];
}

// Exact enum on the `attendance_regularizations` table.
export type RegularizationStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface RegularizationRecord {
  id: number;
  attendance_id: number | null;
  employee_id: number;
  attendance_date: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  description: string | null;
  status: RegularizationStatus;
  requested_by: number;
  reviewed_by: number | null;
  reviewed_at: string | null;
  reviewer_remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRegularizationPayload {
  attendance_date: string;
  requested_check_in?: string;
  requested_check_out?: string;
  reason: string;
  description?: string;
}
