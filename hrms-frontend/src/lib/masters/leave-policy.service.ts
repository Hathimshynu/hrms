// src/lib/masters/leave-policy.service.ts
//
// /api/employee-masters/leave-policies (EmployeeMasterController@leavePolicies
// /createLeavePolicy/updateLeavePolicy/deleteLeavePolicy). No fields beyond
// the shared base (name/code/description/is_active) - see
// masterCreate/masterUpdate field lists in the controller.
import { createMasterService, type BaseMasterDto, type BaseMasterPayload } from "./master.service";

export type LeavePolicyDto = BaseMasterDto;
export type LeavePolicyPayload = BaseMasterPayload;

export const leavePolicyService = createMasterService<LeavePolicyDto, LeavePolicyPayload>(
  "leave-policies",
);
