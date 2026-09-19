"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";
import { employeeMastersService, type MasterOption } from "@/src/lib/employees/employee-masters.service";
import { useEffect, useState } from "react";
import type { OnboardingValues, StepProps } from "../onboarding-form.types";

// Exact enum accepted by SaveEmployeeDraftRequest::stepElevenRules (hrms-backend).
const onboardingStatuses = [
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

export function OnboardingStep({ values, onChange, errors }: StepProps<OnboardingValues>) {
  const [checklists, setChecklists] = useState<MasterOption[]>([]);

  useEffect(() => {
    employeeMastersService.onboardingChecklists().then(setChecklists).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Onboarding Status</label>
          <Select
            placeholder="Select onboarding status"
            options={onboardingStatuses}
            value={values.onboarding_status}
            clearable
            onChange={(v) => onChange({ onboarding_status: v as string })}
            error={errors.onboarding_status}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Onboarding Start Date</label>
          <Input
            type="date"
            value={values.onboarding_start_date}
            onChange={(e) => onChange({ onboarding_start_date: e.target.value })}
            error={errors.onboarding_start_date}
          />
        </div>
      </div>

      <div className="space-y-2 grid gap-px">
        <label className="text-sm font-medium text-gray-700">Onboarding Checklist</label>
        <Select
          placeholder="Select onboarding checklist"
          options={checklists.map((c) => ({ label: c.name, value: String(c.id) }))}
          value={values.onboarding_checklist_id}
          clearable
          onChange={(v) => onChange({ onboarding_checklist_id: v as string })}
          error={errors.onboarding_checklist_id}
        />
      </div>

      {/* Assigned Buddy and Equipment Required were removed: the backend
          expects assigned_buddy_id to reference a real users.id, but
          GET /api/users is broken (missing controller methods - see the
          Phase 0 audit), and there is no equipment list endpoint at all
          (only a create-time pivot). Neither can be populated with real
          data without a backend change, so no picker is shown rather than
          inventing fake options - both fields are optional on the backend. */}

      <div className="space-y-2 grid gap-px">
        <label className="text-sm font-medium text-gray-700">HR Notes</label>
        <Textarea
          placeholder="Enter HR notes"
          rows={4}
          value={values.hr_notes}
          onChange={(e) => onChange({ hr_notes: e.target.value })}
          error={errors.hr_notes}
        />
      </div>
    </div>
  );
}
