"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";

const onboardingStatuses = [
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "On Hold", value: "on_hold" },
];

const onboardingChecklists = [
  { label: "Document Verification", value: "document_verification" },
  { label: "HR Orientation", value: "hr_orientation" },
  { label: "Company Policies", value: "company_policies" },
  { label: "Team Introduction", value: "team_introduction" },
  { label: "IT Setup", value: "it_setup" },
  { label: "Payroll Setup", value: "payroll_setup" },
  { label: "Access Setup", value: "access_setup" },
];

const equipmentRequired = [
  { label: "Laptop", value: "laptop" },
  { label: "Monitor", value: "monitor" },
  { label: "Keyboard", value: "keyboard" },
  { label: "Mouse", value: "mouse" },
  { label: "ID Card", value: "id_card" },
  { label: "Access Card", value: "access_card" },
  { label: "Headset", value: "headset" },
  { label: "Mobile Phone", value: "mobile_phone" },
];

const buddies = [
  { label: "Select Buddy", value: "select_buddy" },
  { label: "John Smith", value: "john_smith" },
  { label: "David Wilson", value: "david_wilson" },
  { label: "Sarah Johnson", value: "sarah_johnson" },
];

export function OnboardingStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="onboardingStatus"
            className="text-sm font-medium text-gray-700"
          >
            Onboarding Status
          </label>

          <Select
            id="onboardingStatus"
            name="onboardingStatus"
            placeholder="Select onboarding status"
            options={onboardingStatuses}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="onboardingStartDate"
            className="text-sm font-medium text-gray-700"
          >
            Onboarding Start Date
          </label>

          <Input
            id="onboardingStartDate"
            name="onboardingStartDate"
            type="date"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="onboardingChecklist"
            className="text-sm font-medium text-gray-700"
          >
            Onboarding Checklist
          </label>

          <Select
            id="onboardingChecklist"
            name="onboardingChecklist"
            placeholder="Select onboarding checklist"
            options={onboardingChecklists}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="assignedBuddy"
            className="text-sm font-medium text-gray-700"
          >
            Assigned Buddy
          </label>

          <Select
            id="assignedBuddy"
            name="assignedBuddy"
            placeholder="Select assigned buddy"
            options={buddies}
          />
        </div>
      </div>

      <div className="space-y-2 grid gap-px">
        <label
          htmlFor="equipmentRequired"
          className="text-sm font-medium text-gray-700"
        >
          Equipment Required
        </label>

        <Select
          id="equipmentRequired"
          name="equipmentRequired"
          placeholder="Select equipment"
          options={equipmentRequired}
          isMultiSelect
        />
      </div>

      <div className="space-y-2 grid gap-px">
        <label htmlFor="hrNotes" className="text-sm font-medium text-gray-700">
          HR Notes
        </label>

        <Textarea
          id="hrNotes"
          name="hrNotes"
          placeholder="Enter HR notes"
          rows={4}
        />
      </div>
    </div>
  );
}
