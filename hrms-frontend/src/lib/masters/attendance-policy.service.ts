// src/lib/masters/attendance-policy.service.ts
//
// /api/employee-masters/attendance-policies (EmployeeMasterController@attendancePolicies
// /createAttendancePolicy/updateAttendancePolicy/deleteAttendancePolicy). No
// fields beyond the shared base (name/code/description/is_active).
import { createMasterService, type BaseMasterDto, type BaseMasterPayload } from "./master.service";

export type AttendancePolicyDto = BaseMasterDto;
export type AttendancePolicyPayload = BaseMasterPayload;

export const attendancePolicyService = createMasterService<
  AttendancePolicyDto,
  AttendancePolicyPayload
>("attendance-policies");
