// src/lib/masters/onboarding-checklist.service.ts
//
// /api/employee-masters/onboarding-checklists (EmployeeMasterController@onboardingChecklists
// /createOnboardingChecklist/updateOnboardingChecklist/deleteOnboardingChecklist).
// No fields beyond the shared base (name/code/description/is_active).
import { createMasterService, type BaseMasterDto, type BaseMasterPayload } from "./master.service";

export type OnboardingChecklistDto = BaseMasterDto;
export type OnboardingChecklistPayload = BaseMasterPayload;

export const onboardingChecklistService = createMasterService<
  OnboardingChecklistDto,
  OnboardingChecklistPayload
>("onboarding-checklists");
