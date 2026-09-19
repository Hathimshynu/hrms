// src/lib/masters/weekly-off.service.ts
//
// /api/employee-masters/weekly-offs (EmployeeMasterController@weeklyOffs
// /createWeeklyOff/updateWeeklyOff/deleteWeeklyOff). Adds `days` (array,
// nullable - WeeklyOff model casts it 'array') on top of the shared base
// fields. Backend only validates it's an array with no fixed enum, so the
// form offers a multi-select of the 7 weekday names.
import { createMasterService, type BaseMasterDto, type BaseMasterPayload } from "./master.service";

export interface WeeklyOffDto extends BaseMasterDto {
  days: string[] | null;
}

export interface WeeklyOffPayload extends BaseMasterPayload {
  days: string[];
}

export const weeklyOffService = createMasterService<WeeklyOffDto, WeeklyOffPayload>(
  "weekly-offs",
);
