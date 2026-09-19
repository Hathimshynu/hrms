// src/lib/employees/onboarding.service.ts
//
// Wraps the verified EmployeeDraftController endpoints (draft + 11-step
// onboarding). Field names/shapes are taken directly from
// hrms-backend EmployeeDraftController + EmployeeOnboardingService.
import { api } from "../api/axios";

export interface DraftSummary {
  id: number;
  employee_id: number | null;
  current_step: number;
  completed_steps: number[];
  next_step: number | null;
  status: "draft" | "completed" | "cancelled";
  last_saved_at: string | null;
}

export interface DraftListItem {
  id: number;
  employee_id: number | null;
  current_step: number;
  completed_steps: number[];
  status: string;
  last_saved_at: string | null;
  employee?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface StepEmployeeSummary {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  employment_status?: string;
  lifecycle?: string;
}

export interface SaveStepResponse {
  success: boolean;
  message: string;
  data: {
    draft: DraftSummary;
    employee: StepEmployeeSummary | null;
  };
}

// Shape returned by GET /employee-onboarding/drafts/{id} - a full nested
// dump of everything captured so far (see formatFullDraft() in
// EmployeeDraftController). Used to resume/prefill the wizard.
export interface FullDraft {
  draft: DraftSummary;
  employee: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    alternate_phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    marital_status: string | null;
    profile_photo: string | null;
    employment_status: string;
    lifecycle: string;
  } | null;
  employment: {
    employment_type: string | null;
    probation_end_date: string | null;
    joining_date: string | null;
    department_id: number | null;
    department: { id: number; name: string; code: string } | null;
    designation_id: number | null;
    designation: { id: number; name: string; code: string } | null;
    branch_id: number | null;
    branch: { id: number; name: string; code: string } | null;
    location_id: number | null;
    location: { id: number; name: string; code: string } | null;
    reporting_manager_id: number | null;
    reporting_manager: { id: number; employee_code: string; name: string } | null;
    employment_level: string | null;
    work_mode: string | null;
    shift_id: number | null;
    work_schedule_id: number | null;
  } | null;
  account: {
    user_id: number;
    email: string;
    username: string | null;
    role_id: number;
    access_level: string;
    role: { id: number; name: string } | null;
    is_active: boolean;
    must_change_password: boolean;
  } | null;
  address: Array<{
    id: number;
    type: "current" | "permanent";
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  }>;
  emergency_contact: Array<{
    id: number;
    contact_name: string;
    relationship: string;
    phone: string;
    alternate_phone: string | null;
    address: string | null;
  }>;
  compensation: Array<{
    id: number;
    salary_type: string;
    annual_ctc: string | number;
    basic_salary: string | number | null;
    hra: string | number | null;
    other_allowances: string | number | null;
    bonus: string | number | null;
    pay_frequency: string;
    effective_from: string;
  }>;
  bank_details: Array<{
    id: number;
    bank_name: string | null;
    account_holder_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
    account_type: string | null;
    pan: string | null;
    uan: string | null;
    pf_number: string | null;
  }>;
  documents: Array<{
    id: number;
    document_type: string;
    status: string | null;
    file_path: string | null;
    file_name: string | null;
    mime_type: string | null;
    file_size: number | null;
  }>;
  education: Array<{ id: number; qualification: string; institution: string | null }>;
  experience: Array<{
    id: number;
    years_of_experience: number;
    previous_company: string | null;
    languages: string | null;
  }>;
  leave_attendance: {
    id: number;
    leave_policy_id: number | null;
    leave_policy: { id: number; name: string; code: string } | null;
    attendance_policy_id: number | null;
    attendance_policy: { id: number; name: string; code: string } | null;
    work_schedule_id: number | null;
    work_schedule: { id: number; name: string; code: string } | null;
    shift_id: number | null;
    shift: { id: number; name: string; code: string } | null;
    weekly_off_id: number | null;
    weekly_off: { id: number; name: string; code: string; days: string[] } | null;
    late_policy_id: number | null;
    late_policy: { id: number; name: string; code: string } | null;
    overtime_policy_id: number | null;
    overtime_policy: { id: number; name: string; code: string } | null;
  } | null;
  onboarding: {
    id: number;
    onboarding_status: string;
    start_date: string | null;
    checklist_id: number | null;
    checklist: { id: number; name: string; code: string } | null;
    assigned_buddy_id: number | null;
    assigned_buddy: { id: number; name: string; email: string } | null;
    hr_notes: string | null;
    equipment: Array<{
      id: number;
      name: string;
      code: string;
      category: string;
      status: string;
      assigned_at: string | null;
      returned_at: string | null;
      notes: string | null;
    }>;
  } | null;
}

export interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
  data: {
    employee: {
      id: number;
      employee_code: string;
      name: string;
      email: string;
      department: string | null;
      designation: string | null;
      status: string;
      lifecycle: string;
    };
    account: { user_id: number; email: string; role_id: number; must_change_password: boolean };
    onboarding: { status: string };
    email: { sent: boolean };
  };
}

export const onboardingService = {
  start: () =>
    api
      .post<{ success: boolean; message: string; data: { draft: DraftSummary } }>(
        "/employee-onboarding/start"
      )
      .then((res) => res.data.data.draft),

  listDrafts: () =>
    api
      .get<{ success: boolean; data: DraftListItem[] }>("/employee-onboarding/drafts")
      .then((res) => res.data.data),

  getDraft: (draftId: number) =>
    api
      .get<{ success: boolean; data: FullDraft }>(`/employee-onboarding/drafts/${draftId}`)
      .then((res) => res.data.data),

  // `step` is 1-11. `payload` must include draft_id, per SaveEmployeeDraftRequest.
  // Step 8 (documents) needs multipart/form-data - pass a FormData instance
  // and axios will set the correct Content-Type/boundary automatically.
  saveStep: (step: number, payload: Record<string, unknown> | FormData) =>
    api
      .post<SaveStepResponse>(`/employee-onboarding/steps/${step}`, payload)
      .then((res) => res.data),

  complete: (draftId: number) =>
    api
      .post<CompleteOnboardingResponse>("/employee-onboarding/complete", { draft_id: draftId })
      .then((res) => res.data),

  cancelDraft: (draftId: number) =>
    api
      .delete<{ success: boolean; message: string }>(`/employee-onboarding/drafts/${draftId}`)
      .then((res) => res.data),
};
