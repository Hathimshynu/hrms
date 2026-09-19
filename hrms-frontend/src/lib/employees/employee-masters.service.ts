// src/lib/employees/employee-masters.service.ts
//
// Read-only lookup endpoints under /employee-masters/* (verified in the
// Phase 0/3 audits: branches and locations are read-only; the 8 policy
// masters below have full CRUD but no frontend admin page yet - only
// their GET list is used here, to populate onboarding dropdowns).
import { api } from "../api/axios";

export interface MasterOption {
  id: number;
  name: string;
  code: string;
}

export interface BranchDto extends MasterOption {
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface LocationDto extends MasterOption {
  branch_id: number;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface ReportingManagerDto {
  id: number;
  employee_code: string;
  name: string;
  department_id: number | null;
  designation_id: number | null;
}

export interface ShiftDto extends MasterOption {
  start_time: string | null;
  end_time: string | null;
  working_hours: number | null;
}

export interface WorkScheduleDto extends MasterOption {
  start_time: string | null;
  end_time: string | null;
  working_hours: number | null;
}

export interface WeeklyOffDto extends MasterOption {
  days: string[];
}

function unwrap<T>(promise: Promise<{ data: { success: boolean; data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const employeeMastersService = {
  branches: () => unwrap<BranchDto[]>(api.get("/employee-masters/branches")),

  locations: (params?: { branch_id?: number }) =>
    unwrap<LocationDto[]>(api.get("/employee-masters/locations", { params })),

  reportingManagers: (params?: { department_id?: number }) =>
    unwrap<ReportingManagerDto[]>(
      api.get("/employee-masters/reporting-managers", { params })
    ),

  leavePolicies: () => unwrap<MasterOption[]>(api.get("/employee-masters/leave-policies")),

  attendancePolicies: () =>
    unwrap<MasterOption[]>(api.get("/employee-masters/attendance-policies")),

  workSchedules: () => unwrap<WorkScheduleDto[]>(api.get("/employee-masters/work-schedules")),

  shifts: () => unwrap<ShiftDto[]>(api.get("/employee-masters/shifts")),

  weeklyOffs: () => unwrap<WeeklyOffDto[]>(api.get("/employee-masters/weekly-offs")),

  latePolicies: () => unwrap<MasterOption[]>(api.get("/employee-masters/late-policies")),

  overtimePolicies: () =>
    unwrap<MasterOption[]>(api.get("/employee-masters/overtime-policies")),

  onboardingChecklists: () =>
    unwrap<MasterOption[]>(api.get("/employee-masters/onboarding-checklists")),
};
