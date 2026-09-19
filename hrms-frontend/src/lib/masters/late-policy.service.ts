// src/lib/masters/late-policy.service.ts
//
// /api/employee-masters/late-policies (EmployeeMasterController@latePolicies
// /createLatePolicy/updateLatePolicy/deleteLatePolicy). Adds grace_minutes
// and max_late_minutes (integer, nullable - LatePolicy model casts both
// 'integer') on top of the shared base fields.
import { createMasterService, type BaseMasterDto, type BaseMasterPayload } from "./master.service";

export interface LatePolicyDto extends BaseMasterDto {
  grace_minutes: number | null;
  max_late_minutes: number | null;
}

export interface LatePolicyPayload extends BaseMasterPayload {
  grace_minutes?: number | null;
  max_late_minutes?: number | null;
}

export const latePolicyService = createMasterService<LatePolicyDto, LatePolicyPayload>(
  "late-policies",
);
