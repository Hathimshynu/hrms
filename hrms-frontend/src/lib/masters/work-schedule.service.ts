// src/lib/masters/work-schedule.service.ts
//
// /api/employee-masters/work-schedules (EmployeeMasterController@workSchedules
// /createWorkSchedule/updateWorkSchedule/deleteWorkSchedule). Adds
// start_time/end_time (H:i, nullable) and working_hours (numeric,
// nullable - WorkSchedule model casts it 'decimal:2', which Laravel
// serializes as a string, e.g. "8.00") on top of the shared base fields.
import { createMasterService, type BaseMasterDto, type BaseMasterPayload } from "./master.service";

export interface WorkScheduleDto extends BaseMasterDto {
  start_time: string | null;
  end_time: string | null;
  working_hours: string | number | null;
}

export interface WorkSchedulePayload extends BaseMasterPayload {
  start_time?: string | null;
  end_time?: string | null;
  working_hours?: number | null;
}

export const workScheduleService = createMasterService<WorkScheduleDto, WorkSchedulePayload>(
  "work-schedules",
);
