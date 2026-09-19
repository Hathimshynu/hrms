"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import type { EmergencyContactValues, StepProps } from "../onboarding-form.types";

const relationships = [
  { label: "Parent", value: "Parent" },
  { label: "Spouse", value: "Spouse" },
  { label: "Sibling", value: "Sibling" },
  { label: "Child", value: "Child" },
  { label: "Relative", value: "Relative" },
  { label: "Friend", value: "Friend" },
  { label: "Other", value: "Other" },
];

export function EmergencyContactStep({
  values,
  onChange,
  errors,
}: StepProps<EmergencyContactValues>) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="emergencyContactName" className="text-sm font-medium text-gray-700">
            Contact Name
          </label>
          <Input
            id="emergencyContactName"
            placeholder="Enter contact name"
            value={values.name}
            onChange={(e) => onChange({ name: e.target.value })}
            error={errors.name}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="emergencyRelationship" className="text-sm font-medium text-gray-700">
            Relationship
          </label>
          <Select
            id="emergencyRelationship"
            placeholder="Select relationship"
            options={relationships}
            value={values.relationship}
            clearable
            onChange={(v) => onChange({ relationship: v as string })}
            error={errors.relationship}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="emergencyPhone" className="text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <Input
            id="emergencyPhone"
            type="tel"
            placeholder="Enter phone number"
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            error={errors.phone}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="emergencyAlternatePhone" className="text-sm font-medium text-gray-700">
            Alternate Phone
          </label>
          <Input
            id="emergencyAlternatePhone"
            type="tel"
            placeholder="Enter alternate phone"
            value={values.alternate_phone}
            onChange={(e) => onChange({ alternate_phone: e.target.value })}
            error={errors.alternate_phone}
          />
        </div>
      </div>

      <div className="grid">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="emergencyAddress" className="text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="emergencyAddress"
            placeholder="Enter address"
            rows={5}
            value={values.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />
          {errors.address && <p className="text-xs text-red-600">{errors.address}</p>}
        </div>
      </div>
    </div>
  );
}
