// src/lib/masters/shift.service.ts
//
// /api/employee-masters/shifts (EmployeeMasterController@shifts
// /createShift/updateShift/deleteShift). Same extra-field shape as Work
// Schedules: start_time/end_time (H:i, nullable) and working_hours
// (numeric, nullable - Shift model casts it 'decimal:2' -> string like
// "8.00") on top of the shared base fields.
import { createMasterService, type BaseMasterDto, type BaseMasterPayload } from "./master.service";

export interface ShiftDto extends BaseMasterDto {
  start_time: string | null;
  end_time: string | null;
  working_hours: string | number | null;
}

export interface ShiftPayload extends BaseMasterPayload {
  start_time?: string | null;
  end_time?: string | null;
  working_hours?: number | null;
}

export const shiftService = createMasterService<ShiftDto, ShiftPayload>("shifts");
