// src/lib/masters/overtime-policy.service.ts
//
// /api/employee-masters/overtime-policies (EmployeeMasterController@overtimePolicies
// /createOvertimePolicy/updateOvertimePolicy/deleteOvertimePolicy). Adds
// minimum_hours and multiplier (numeric, nullable - OvertimePolicy model
// casts both 'decimal:2', serialized as strings like "1.50") on top of the
// shared base fields.
import { createMasterService, type BaseMasterDto, type BaseMasterPayload } from "./master.service";

export interface OvertimePolicyDto extends BaseMasterDto {
  minimum_hours: string | number | null;
  multiplier: string | number | null;
}

export interface OvertimePolicyPayload extends BaseMasterPayload {
  minimum_hours?: number | null;
  multiplier?: number | null;
}

export const overtimePolicyService = createMasterService<
  OvertimePolicyDto,
  OvertimePolicyPayload
>("overtime-policies");
