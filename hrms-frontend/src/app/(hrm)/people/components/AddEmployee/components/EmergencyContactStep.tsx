"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";

const relationships = [
  { label: "Parent", value: "parent" },
  { label: "Spouse", value: "spouse" },
  { label: "Sibling", value: "sibling" },
  { label: "Child", value: "child" },
  { label: "Relative", value: "relative" },
  { label: "Friend", value: "friend" },
  { label: "Other", value: "other" },
];

export function EmergencyContactStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="emergencyContactName"
            className="text-sm font-medium text-gray-700"
          >
            Contact Name
          </label>

          <Input
            id="emergencyContactName"
            name="emergencyContactName"
            placeholder="Enter contact name"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="emergencyRelationship"
            className="text-sm font-medium text-gray-700"
          >
            Relationship
          </label>

          <Select
            id="emergencyRelationship"
            name="emergencyRelationship"
            placeholder="Select relationship"
            options={relationships}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="emergencyPhone"
            className="text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>

          <Input
            id="emergencyPhone"
            name="emergencyPhone"
            type="tel"
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="emergencyAlternatePhone"
            className="text-sm font-medium text-gray-700"
          >
            Alternate Phone
          </label>

          <Input
            id="emergencyAlternatePhone"
            name="emergencyAlternatePhone"
            type="tel"
            placeholder="Enter alternate phone"
          />
        </div>
      </div>

      <div className="grid">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="emergencyAddress"
            className="text-sm font-medium text-gray-700"
          >
            Address
          </label>

          <textarea
            id="emergencyAddress"
            name="emergencyAddress"
            placeholder="Enter address"
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />
        </div>
      </div>
    </div>
  );
}