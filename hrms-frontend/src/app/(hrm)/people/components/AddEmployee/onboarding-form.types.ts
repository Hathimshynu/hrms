// Field names mirror SaveEmployeeDraftRequest exactly (hrms-backend),
// step by step. This is the single source of wizard form state, owned by
// AddEmployee.tsx and passed down so data survives step navigation.

export interface PersonalValues {
  profile_photo: string; // base64 data URL, or ""
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
}

export interface EmploymentValues {
  employment_type: string;
  probation_end_date: string;
  joining_date: string;
  department_id: string;
  designation_id: string;
  branch_id: string;
  location_id: string;
  reporting_manager_id: string;
  employment_level: string;
  work_mode: string;
}

export interface WorkContactValues {
  work_email: string;
  work_phone: string;
  role_id: string;
  access_level: string;
}

export interface AddressBlock {
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface AddressValues {
  current_address: AddressBlock;
  same_as_current: boolean;
  permanent_address: AddressBlock;
}

export interface EmergencyContactValues {
  name: string;
  relationship: string;
  phone: string;
  alternate_phone: string;
  address: string;
}

export interface CompensationValues {
  salary_type: string;
  annual_ctc: string;
  basic_salary: string;
  hra: string;
  other_allowances: string;
  bonus: string;
  pay_frequency: string;
  effective_from: string;
}

export interface BankValues {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  pan: string;
  uan: string;
  pf_number: string;
}

export interface DocumentEntry {
  document_type: string;
  status: string;
  document_number: string;
  file: File | null;
  previewUrl?: string;
}

export interface DocumentsValues {
  documents: DocumentEntry[];
}

export interface ProfessionalValues {
  highest_qualification: string;
  university_institution: string;
  years_of_experience: string;
  previous_company: string;
  languages: string[];
}

export interface LeaveAttendanceValues {
  leave_policy_id: string;
  attendance_policy_id: string;
  work_schedule_id: string;
  shift_id: string;
  weekly_off_id: string;
  late_policy_id: string;
  overtime_policy_id: string;
}

export interface OnboardingValues {
  onboarding_status: string;
  onboarding_start_date: string;
  onboarding_checklist_id: string;
  assigned_buddy_id: string;
  equipment_required: string[];
  hr_notes: string;
}

export interface OnboardingFormState {
  personal: PersonalValues;
  employment: EmploymentValues;
  workContact: WorkContactValues;
  address: AddressValues;
  emergency: EmergencyContactValues;
  compensation: CompensationValues;
  bank: BankValues;
  documents: DocumentsValues;
  professional: ProfessionalValues;
  leaveAttendance: LeaveAttendanceValues;
  onboarding: OnboardingValues;
}

const EMPTY_ADDRESS: AddressBlock = {
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  country: "",
  postal_code: "",
};

export const EMPTY_FORM_STATE: OnboardingFormState = {
  personal: {
    profile_photo: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    alternate_phone: "",
    date_of_birth: "",
    gender: "",
    marital_status: "",
  },
  employment: {
    employment_type: "",
    probation_end_date: "",
    joining_date: "",
    department_id: "",
    designation_id: "",
    branch_id: "",
    location_id: "",
    reporting_manager_id: "",
    employment_level: "",
    work_mode: "",
  },
  workContact: {
    work_email: "",
    work_phone: "",
    role_id: "",
    access_level: "",
  },
  address: {
    current_address: { ...EMPTY_ADDRESS },
    same_as_current: false,
    permanent_address: { ...EMPTY_ADDRESS },
  },
  emergency: {
    name: "",
    relationship: "",
    phone: "",
    alternate_phone: "",
    address: "",
  },
  compensation: {
    salary_type: "annual",
    annual_ctc: "",
    basic_salary: "",
    hra: "",
    other_allowances: "",
    bonus: "",
    pay_frequency: "monthly",
    effective_from: "",
  },
  bank: {
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    account_type: "savings",
    pan: "",
    uan: "",
    pf_number: "",
  },
  documents: {
    documents: [],
  },
  professional: {
    highest_qualification: "",
    university_institution: "",
    years_of_experience: "",
    previous_company: "",
    languages: [],
  },
  leaveAttendance: {
    leave_policy_id: "",
    attendance_policy_id: "",
    work_schedule_id: "",
    shift_id: "",
    weekly_off_id: "",
    late_policy_id: "",
    overtime_policy_id: "",
  },
  onboarding: {
    onboarding_status: "in_progress",
    onboarding_start_date: "",
    onboarding_checklist_id: "",
    assigned_buddy_id: "",
    equipment_required: [],
    hr_notes: "",
  },
};

export interface StepProps<T> {
  values: T;
  onChange: (patch: Partial<T>) => void;
  errors: Record<string, string>;
}
