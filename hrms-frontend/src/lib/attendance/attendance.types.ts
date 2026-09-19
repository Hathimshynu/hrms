// src/lib/attendance/attendance.types.ts
//
// Shapes verified directly against hrms-backend AttendanceController
// (formatAttendance()) and the `attendances` table migration. Kept
// framework-agnostic (no Next.js/DOM types) so the same contract can be
// reused by the future React Native app against the identical API.

// Exact enum on the `attendances` table (database/migrations - hr_system_tables
// + add_location_fields_to_attendances_table).
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
  attendance_date: string | null; // Y-m-d
  check_in_at: string | null; // Y-m-d H:i:s, Asia/Kolkata (app timezone)
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

// Admin-scope AttendanceController@index/employeeAttendance embed the
// employee + its department/designation/branch/location relations.
export interface AttendanceRecordWithEmployee extends AttendanceRecord {
  employee?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    department?: { id: number; name: string; code: string } | null;
    designation?: { id: number; name: string; code: string } | null;
    branch?: { id: number; name: string; code: string } | null;
    location?: { id: number; name: string; code: string } | null;
  } | null;
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

export interface AdminAttendanceParams extends AttendanceHistoryParams {
  employee_id?: number;
  attendance_date?: string;
  status?: AttendanceStatus;
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

export interface AttendanceSummaryResponse {
  date: string;
  total_records: number;
  present: number;
  late: number;
  half_day: number;
  on_leave: number;
  absent: number;
  holiday: number;
  week_off: number;
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
  employee?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface CreateRegularizationPayload {
  attendance_date: string;
  requested_check_in?: string;
  requested_check_out?: string;
  reason: string;
  description?: string;
}
