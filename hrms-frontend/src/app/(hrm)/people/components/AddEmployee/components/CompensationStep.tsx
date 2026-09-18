"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";

const salaryTypes = [
  { label: "Annual", value: "annual" },
  { label: "Monthly", value: "monthly" },
  { label: "Hourly", value: "hourly" },
];

const payFrequencies = [
  { label: "Monthly", value: "monthly" },
  { label: "Bi-Weekly", value: "bi_weekly" },
  { label: "Weekly", value: "weekly" },
];

export function CompensationStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="salaryType"
            className="text-sm font-medium text-gray-700"
          >
            Salary Type
          </label>

          <Select
            id="salaryType"
            name="salaryType"
            placeholder="Select salary type"
            options={salaryTypes}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="annualCtc"
            className="text-sm font-medium text-gray-700"
          >
            Annual CTC
          </label>

          <Input
            id="annualCtc"
            name="annualCtc"
            type="number"
            placeholder="Enter annual CTC"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="basicSalary"
            className="text-sm font-medium text-gray-700"
          >
            Basic Salary
          </label>

          <Input
            id="basicSalary"
            name="basicSalary"
            type="number"
            placeholder="Enter basic salary"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="hra"
            className="text-sm font-medium text-gray-700"
          >
            HRA
          </label>

          <Input
            id="hra"
            name="hra"
            type="number"
            placeholder="Enter HRA"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="otherAllowances"
            className="text-sm font-medium text-gray-700"
          >
            Other Allowances
          </label>

          <Input
            id="otherAllowances"
            name="otherAllowances"
            type="number"
            placeholder="Enter other allowances"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="bonus"
            className="text-sm font-medium text-gray-700"
          >
            Bonus
          </label>

          <Input
            id="bonus"
            name="bonus"
            type="number"
            placeholder="Enter bonus"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="payFrequency"
            className="text-sm font-medium text-gray-700"
          >
            Pay Frequency
          </label>

          <Select
            id="payFrequency"
            name="payFrequency"
            placeholder="Select pay frequency"
            options={payFrequencies}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="effectiveFrom"
            className="text-sm font-medium text-gray-700"
          >
            Effective From
          </label>

          <Input
            id="effectiveFrom"
            name="effectiveFrom"
            type="date"
          />
        </div>
      </div>
    </div>
  );
}