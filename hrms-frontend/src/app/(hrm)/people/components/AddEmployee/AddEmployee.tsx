"use client";

import { toDateInputValue } from "@/src/lib/date/format";
import { Button } from "@/src/components/ui/Button";
import { Drawer, DrawerContent } from "@/src/components/ui/drawer";
import { Step, Stepper } from "@/src/components/ui/stepper";
import { parseApiError } from "@/src/lib/api/errors";
import { onboardingService, type FullDraft } from "@/src/lib/employees/onboarding.service";
import { useEffect, useState } from "react";
import { AddressDetailsStep } from "./components/AddressDetailsStep";
import { BankPayrollStep } from "./components/BankPayrollStep";
import { CompensationStep } from "./components/CompensationStep";
import { DocumentsStep } from "./components/DocumentsStep";
import { EmergencyContactStep } from "./components/EmergencyContactStep";
import { EmployeeInfoStep } from "./components/EmploymentInfo";
import { LeaveAttendanceConfigurationStep } from "./components/LeaveAttendanceStep";
import { OnboardingStep } from "./components/OnboardingStep";
import { PersonalInfoStep } from "./components/PersonalInfo";
import { SkillsProfessionalInfoStep } from "./components/SkillsProfessionalInfoStep";
import { WorkContactAccountStep } from "./components/WorkContactAccountStep";
import { EMPTY_FORM_STATE, type OnboardingFormState } from "./onboarding-form.types";

interface AddEmployeeProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCompleted: (result?: { emailSent: boolean }) => void;
}

const STEPS: Step[] = [
  { id: "personal", title: "Personal Information", description: "Basic personal details" },
  { id: "employment", title: "Employment Information", description: "Job and department details" },
  { id: "work-contact", title: "Work Contact & Account", description: "Work email and access" },
  { id: "address", title: "Address", description: "Current address details" },
  { id: "emergency", title: "Emergency Contact", description: "Emergency contact person" },
  { id: "compensation", title: "Compensation", description: "Salary and benefits" },
  { id: "bank-payroll", title: "Bank & Payroll", description: "Payment details" },
  { id: "documents", title: "Documents", description: "Upload required documents" },
  { id: "skills", title: "Skills & Professional Info", description: "Skills and qualifications" },
  { id: "leave-attendance", title: "Leave & Attendance", description: "Leave policies and attendance" },
  { id: "onboarding", title: "Onboarding", description: "Onboarding tasks and completion" },
];

// Converts the browser's <input type="date"> value (YYYY-MM-DD) to the
// d-m-Y format CompleteEmployeeRequest/SaveEmployeeDraftRequest step 11
// actually requires.
function toDMY(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
}

function hydrateFromDraft(draft: FullDraft): OnboardingFormState {
  const state: OnboardingFormState = JSON.parse(JSON.stringify(EMPTY_FORM_STATE));

  if (draft.employee) {
    state.personal = {
      profile_photo: "",
      first_name: draft.employee.first_name ?? "",
      last_name: draft.employee.last_name ?? "",
      email: draft.employee.email ?? "",
      phone: "",
      alternate_phone: "",
      date_of_birth: toDateInputValue(draft.employee.date_of_birth),
      gender: draft.employee.gender ?? "",
      marital_status: draft.employee.marital_status ?? "",
    };
  }

  if (draft.employment) {
    state.employment = {
      employment_type: draft.employment.employment_type ?? "",
      probation_end_date: toDateInputValue(draft.employment.probation_end_date),
      joining_date: toDateInputValue(draft.employment.joining_date),
      department_id: draft.employment.department_id ? String(draft.employment.department_id) : "",
      designation_id: draft.employment.designation_id ? String(draft.employment.designation_id) : "",
      branch_id: draft.employment.branch_id ? String(draft.employment.branch_id) : "",
      location_id: draft.employment.location_id ? String(draft.employment.location_id) : "",
      reporting_manager_id: draft.employment.reporting_manager_id
        ? String(draft.employment.reporting_manager_id)
        : "",
      employment_level: draft.employment.employment_level ?? "",
      work_mode: draft.employment.work_mode ?? "",
    };
  }

  if (draft.account) {
    state.workContact = {
      work_email: draft.account.email ?? "",
      work_phone: "",
      role_id: draft.account.role_id ? String(draft.account.role_id) : "",
      access_level: draft.account.access_level ?? "",
    };
  }

  if (draft.address?.length) {
    const current = draft.address.find((a) => a.type === "current");
    const permanent = draft.address.find((a) => a.type === "permanent");
    if (current) {
      state.address.current_address = {
        address_line_1: current.address_line_1 ?? "",
        address_line_2: current.address_line_2 ?? "",
        city: current.city ?? "",
        state: current.state ?? "",
        country: current.country ?? "",
        postal_code: current.postal_code ?? "",
      };
    }
    if (permanent) {
      state.address.permanent_address = {
        address_line_1: permanent.address_line_1 ?? "",
        address_line_2: permanent.address_line_2 ?? "",
        city: permanent.city ?? "",
        state: permanent.state ?? "",
        country: permanent.country ?? "",
        postal_code: permanent.postal_code ?? "",
      };
    }
  }

  if (draft.emergency_contact?.[0]) {
    const ec = draft.emergency_contact[0];
    state.emergency = {
      name: ec.contact_name ?? "",
      relationship: ec.relationship ?? "",
      phone: ec.phone ?? "",
      alternate_phone: ec.alternate_phone ?? "",
      address: ec.address ?? "",
    };
  }

  if (draft.compensation?.[0]) {
    const c = draft.compensation[0];
    state.compensation = {
      salary_type: c.salary_type ?? "annual",
      annual_ctc: c.annual_ctc != null ? String(c.annual_ctc) : "",
      basic_salary: c.basic_salary != null ? String(c.basic_salary) : "",
      hra: c.hra != null ? String(c.hra) : "",
      other_allowances: c.other_allowances != null ? String(c.other_allowances) : "",
      bonus: c.bonus != null ? String(c.bonus) : "",
      pay_frequency: c.pay_frequency ?? "monthly",
      effective_from: toDateInputValue(c.effective_from),
    };
  }

  if (draft.bank_details?.[0]) {
    const b = draft.bank_details[0];
    state.bank = {
      bank_name: b.bank_name ?? "",
      account_holder_name: b.account_holder_name ?? "",
      account_number: b.account_number ?? "",
      ifsc_code: b.ifsc_code ?? "",
      account_type: b.account_type ?? "savings",
      pan: b.pan ?? "",
      uan: b.uan ?? "",
      pf_number: b.pf_number ?? "",
    };
  }

  if (draft.education?.[0] || draft.experience?.[0]) {
    state.professional = {
      highest_qualification: draft.education?.[0]?.qualification ?? "",
      university_institution: draft.education?.[0]?.institution ?? "",
      years_of_experience:
        draft.experience?.[0]?.years_of_experience != null
          ? String(draft.experience[0].years_of_experience)
          : "",
      previous_company: draft.experience?.[0]?.previous_company ?? "",
      languages: draft.experience?.[0]?.languages ? JSON.parse(draft.experience[0].languages) : [],
    };
  }

  if (draft.leave_attendance) {
    const la = draft.leave_attendance;
    state.leaveAttendance = {
      leave_policy_id: la.leave_policy_id ? String(la.leave_policy_id) : "",
      attendance_policy_id: la.attendance_policy_id ? String(la.attendance_policy_id) : "",
      work_schedule_id: la.work_schedule_id ? String(la.work_schedule_id) : "",
      shift_id: la.shift_id ? String(la.shift_id) : "",
      weekly_off_id: la.weekly_off_id ? String(la.weekly_off_id) : "",
      late_policy_id: la.late_policy_id ? String(la.late_policy_id) : "",
      overtime_policy_id: la.overtime_policy_id ? String(la.overtime_policy_id) : "",
    };
  }

  if (draft.onboarding) {
    state.onboarding = {
      onboarding_status: draft.onboarding.onboarding_status ?? "in_progress",
      onboarding_start_date: toDateInputValue(draft.onboarding.start_date),
      onboarding_checklist_id: draft.onboarding.checklist_id
        ? String(draft.onboarding.checklist_id)
        : "",
      assigned_buddy_id: "",
      equipment_required: [],
      hr_notes: draft.onboarding.hr_notes ?? "",
    };
  }

  return state;
}

export function AddEmployee({ isOpen, setIsOpen, onCompleted }: AddEmployeeProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormState>(EMPTY_FORM_STATE);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [employeeCode, setEmployeeCode] = useState<string | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setIsInitializing(true);
    setInitError(null);
    setFormError(null);
    setStepErrors({});

    onboardingService
      .start()
      .then(async (draft) => {
        if (!active) return;
        setDraftId(draft.id);

        if (draft.completed_steps.length > 0) {
          const full = await onboardingService.getDraft(draft.id);
          if (!active) return;
          setFormData(hydrateFromDraft(full));
          setEmployeeCode(full.employee?.employee_code ?? null);
          setActiveStep(Math.min(Math.max((draft.current_step || 1) - 1, 0), STEPS.length - 1));
        } else {
          setFormData(EMPTY_FORM_STATE);
          setActiveStep(0);
        }
      })
      .catch((err) => setInitError(parseApiError(err, "Failed to start onboarding.").message))
      .finally(() => {
        if (active) setIsInitializing(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const updateSection = <K extends keyof OnboardingFormState>(
    section: K,
    patch: Partial<OnboardingFormState[K]>
  ) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  };

  function buildStepPayload(step: number): Record<string, unknown> | FormData {
    switch (step) {
      case 1: {
        const p = formData.personal;
        return {
          draft_id: draftId,
          ...(p.profile_photo ? { profile_photo: p.profile_photo } : {}),
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          phone: p.phone,
          alternate_phone: p.alternate_phone || undefined,
          date_of_birth: p.date_of_birth,
          gender: p.gender,
          marital_status: p.marital_status,
        };
      }
      case 2: {
        const e = formData.employment;
        return {
          draft_id: draftId,
          employment_type: e.employment_type,
          probation_end_date: e.probation_end_date || undefined,
          joining_date: e.joining_date,
          department_id: e.department_id ? Number(e.department_id) : undefined,
          designation_id: e.designation_id ? Number(e.designation_id) : undefined,
          branch_id: e.branch_id ? Number(e.branch_id) : undefined,
          location_id: e.location_id ? Number(e.location_id) : undefined,
          reporting_manager_id: e.reporting_manager_id ? Number(e.reporting_manager_id) : undefined,
          employment_level: e.employment_level || undefined,
          work_mode: e.work_mode || undefined,
        };
      }
      case 3: {
        const w = formData.workContact;
        return {
          draft_id: draftId,
          work_email: w.work_email,
          work_phone: w.work_phone || undefined,
          role_id: w.role_id ? Number(w.role_id) : undefined,
          access_level: w.access_level,
        };
      }
      case 4: {
        const a = formData.address;
        return {
          draft_id: draftId,
          current_address: a.current_address,
          same_as_current: a.same_as_current,
          permanent_address: a.permanent_address,
        };
      }
      case 5: {
        const ec = formData.emergency;
        return {
          draft_id: draftId,
          name: ec.name,
          relationship: ec.relationship,
          phone: ec.phone,
          alternate_phone: ec.alternate_phone || undefined,
          address: ec.address || undefined,
        };
      }
      case 6: {
        const c = formData.compensation;
        return {
          draft_id: draftId,
          salary_type: c.salary_type,
          annual_ctc: c.annual_ctc ? Number(c.annual_ctc) : undefined,
          basic_salary: c.basic_salary ? Number(c.basic_salary) : undefined,
          hra: c.hra ? Number(c.hra) : undefined,
          other_allowances: c.other_allowances ? Number(c.other_allowances) : undefined,
          bonus: c.bonus ? Number(c.bonus) : undefined,
          pay_frequency: c.pay_frequency,
          effective_from: c.effective_from,
        };
      }
      case 7: {
        const b = formData.bank;
        return {
          draft_id: draftId,
          bank_name: b.bank_name,
          account_holder_name: b.account_holder_name,
          account_number: b.account_number,
          ifsc_code: b.ifsc_code,
          account_type: b.account_type,
          pan: b.pan || undefined,
          uan: b.uan || undefined,
          pf_number: b.pf_number || undefined,
        };
      }
      case 8: {
        const fd = new FormData();
        fd.append("draft_id", String(draftId));
        formData.documents.documents.forEach((doc, i) => {
          fd.append(`documents[${i}][document_type]`, doc.document_type);
          fd.append(`documents[${i}][status]`, doc.status || "Active");
          if (doc.document_number) fd.append(`documents[${i}][document_number]`, doc.document_number);
          if (doc.file) fd.append(`documents[${i}][document]`, doc.file);
        });
        return fd;
      }
      case 9: {
        const p = formData.professional;
        return {
          draft_id: draftId,
          highest_qualification: p.highest_qualification,
          university_institution: p.university_institution || undefined,
          years_of_experience: p.years_of_experience ? Number(p.years_of_experience) : undefined,
          previous_company: p.previous_company || undefined,
          languages: p.languages.length ? p.languages : undefined,
        };
      }
      case 10: {
        const la = formData.leaveAttendance;
        return {
          draft_id: draftId,
          leave_policy_id: la.leave_policy_id ? Number(la.leave_policy_id) : undefined,
          attendance_policy_id: la.attendance_policy_id ? Number(la.attendance_policy_id) : undefined,
          work_schedule_id: la.work_schedule_id ? Number(la.work_schedule_id) : undefined,
          shift_id: la.shift_id ? Number(la.shift_id) : undefined,
          weekly_off_id: la.weekly_off_id ? Number(la.weekly_off_id) : undefined,
          late_policy_id: la.late_policy_id ? Number(la.late_policy_id) : undefined,
          overtime_policy_id: la.overtime_policy_id ? Number(la.overtime_policy_id) : undefined,
        };
      }
      case 11: {
        const o = formData.onboarding;
        return {
          draft_id: draftId,
          onboarding_status: o.onboarding_status,
          onboarding_start_date: toDMY(o.onboarding_start_date),
          onboarding_checklist_id: o.onboarding_checklist_id
            ? Number(o.onboarding_checklist_id)
            : undefined,
          hr_notes: o.hr_notes || undefined,
        };
      }
      default:
        return { draft_id: draftId };
    }
  }

  const saveCurrentStep = async (): Promise<boolean> => {
    if (!draftId || isSavingStep) return false;

    setIsSavingStep(true);
    setFormError(null);
    setStepErrors({});
    try {
      const payload = buildStepPayload(activeStep + 1);
      const result = await onboardingService.saveStep(activeStep + 1, payload);
      if (result.data.employee?.employee_code) {
        setEmployeeCode(result.data.employee.employee_code);
      }
      return true;
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to save this step.");
      if (Object.keys(fieldErrors).length > 0) {
        setStepErrors(fieldErrors);
      } else {
        setFormError(message);
      }
      return false;
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleNext = async () => {
    const ok = await saveCurrentStep();
    if (ok && activeStep < STEPS.length - 1) {
      setStepErrors({});
      setFormError(null);
      setActiveStep((s) => s + 1);
    }
  };

  const handlePrevious = () => {
    setStepErrors({});
    setFormError(null);
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const handleComplete = async () => {
    const ok = await saveCurrentStep();
    if (!ok || !draftId) return;

    setIsCompleting(true);
    setFormError(null);
    try {
      const result = await onboardingService.complete(draftId);
      setIsOpen(false);
      onCompleted({ emailSent: result.data?.email?.sent !== false });
    } catch (err) {
      setFormError(parseApiError(err, "Failed to complete onboarding.").message);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <PersonalInfoStep
            values={formData.personal}
            onChange={(patch) => updateSection("personal", patch)}
            errors={stepErrors}
          />
        );
      case 1:
        return (
          <EmployeeInfoStep
            values={formData.employment}
            onChange={(patch) => updateSection("employment", patch)}
            errors={stepErrors}
          />
        );
      case 2:
        return (
          <WorkContactAccountStep
            values={formData.workContact}
            onChange={(patch) => updateSection("workContact", patch)}
            errors={stepErrors}
          />
        );
      case 3:
        return (
          <AddressDetailsStep
            values={formData.address}
            onChange={(patch) => updateSection("address", patch)}
            errors={stepErrors}
          />
        );
      case 4:
        return (
          <EmergencyContactStep
            values={formData.emergency}
            onChange={(patch) => updateSection("emergency", patch)}
            errors={stepErrors}
          />
        );
      case 5:
        return (
          <CompensationStep
            values={formData.compensation}
            onChange={(patch) => updateSection("compensation", patch)}
            errors={stepErrors}
          />
        );
      case 6:
        return (
          <BankPayrollStep
            values={formData.bank}
            onChange={(patch) => updateSection("bank", patch)}
            errors={stepErrors}
          />
        );
      case 7:
        return (
          <DocumentsStep
            values={formData.documents}
            onChange={(patch) => updateSection("documents", patch)}
            errors={stepErrors}
          />
        );
      case 8:
        return (
          <SkillsProfessionalInfoStep
            values={formData.professional}
            onChange={(patch) => updateSection("professional", patch)}
            errors={stepErrors}
          />
        );
      case 9:
        return (
          <LeaveAttendanceConfigurationStep
            values={formData.leaveAttendance}
            onChange={(patch) => updateSection("leaveAttendance", patch)}
            errors={stepErrors}
          />
        );
      case 10:
        return (
          <OnboardingStep
            values={formData.onboarding}
            onChange={(patch) => updateSection("onboarding", patch)}
            errors={stepErrors}
          />
        );
      default:
        return null;
    }
  };

  const currentStep = STEPS[activeStep];
  const isBusy = isSavingStep || isCompleting;

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} swipeDirection="right" modal={true}>
      <DrawerContent
        title="Add New Employee"
        description="Fill in the details to onboard a new employee"
        onClose={() => setIsOpen(false)}
        className="min-w-1xl"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {isInitializing && (
              <div className="flex justify-center py-16">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              </div>
            )}

            {!isInitializing && initError && (
              <div className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {initError}
              </div>
            )}

            {!isInitializing && !initError && (
              <Stepper steps={STEPS} activeStep={activeStep} onStepChange={setActiveStep} orientation="horizontal">
                <div className="mt-6 min-h-75 space-y-4">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{currentStep.title}</h3>
                      <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                    </div>
                    {employeeCode && (
                      <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                        {employeeCode}
                      </span>
                    )}
                  </div>

                  {formError && (
                    <div className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      {formError}
                    </div>
                  )}

                  {renderStepContent()}
                </div>
              </Stepper>
            )}
          </div>

          <div className="shrink-0 rounded-bl-lg border-t bg-white px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handlePrevious} disabled={activeStep === 0 || isBusy}>
                Previous
              </Button>

              {activeStep === STEPS.length - 1 ? (
                <Button onClick={handleComplete} isLoading={isCompleting} disabled={isBusy}>
                  Complete Onboarding
                </Button>
              ) : (
                <Button onClick={handleNext} isLoading={isSavingStep} disabled={isBusy}>
                  Next Step
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="hover:bg-red-50"
                disabled={isBusy}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
