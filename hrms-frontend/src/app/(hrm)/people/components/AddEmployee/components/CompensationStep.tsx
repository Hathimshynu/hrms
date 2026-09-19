"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import type { CompensationValues, StepProps } from "../onboarding-form.types";

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

export function CompensationStep({ values, onChange, errors }: StepProps<CompensationValues>) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="salaryType" className="text-sm font-medium text-gray-700">
            Salary Type
          </label>
          <Select
            id="salaryType"
            placeholder="Select salary type"
            options={salaryTypes}
            value={values.salary_type}
            clearable
            onChange={(v) => onChange({ salary_type: v as string })}
            error={errors.salary_type}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="annualCtc" className="text-sm font-medium text-gray-700">
            Annual CTC
          </label>
          <Input
            id="annualCtc"
            type="number"
            min="0"
            placeholder="Enter annual CTC"
            value={values.annual_ctc}
            onChange={(e) => onChange({ annual_ctc: e.target.value })}
            error={errors.annual_ctc}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="basicSalary" className="text-sm font-medium text-gray-700">
            Basic Salary
          </label>
          <Input
            id="basicSalary"
            type="number"
            min="0"
            placeholder="Enter basic salary"
            value={values.basic_salary}
            onChange={(e) => onChange({ basic_salary: e.target.value })}
            error={errors.basic_salary}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="hra" className="text-sm font-medium text-gray-700">
            HRA
          </label>
          <Input
            id="hra"
            type="number"
            min="0"
            placeholder="Enter HRA"
            value={values.hra}
            onChange={(e) => onChange({ hra: e.target.value })}
            error={errors.hra}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="otherAllowances" className="text-sm font-medium text-gray-700">
            Other Allowances
          </label>
          <Input
            id="otherAllowances"
            type="number"
            min="0"
            placeholder="Enter other allowances"
            value={values.other_allowances}
            onChange={(e) => onChange({ other_allowances: e.target.value })}
            error={errors.other_allowances}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="bonus" className="text-sm font-medium text-gray-700">
            Bonus
          </label>
          <Input
            id="bonus"
            type="number"
            min="0"
            placeholder="Enter bonus"
            value={values.bonus}
            onChange={(e) => onChange({ bonus: e.target.value })}
            error={errors.bonus}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="payFrequency" className="text-sm font-medium text-gray-700">
            Pay Frequency
          </label>
          <Select
            id="payFrequency"
            placeholder="Select pay frequency"
            options={payFrequencies}
            value={values.pay_frequency}
            clearable
            onChange={(v) => onChange({ pay_frequency: v as string })}
            error={errors.pay_frequency}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="effectiveFrom" className="text-sm font-medium text-gray-700">
            Effective From
          </label>
          <Input
            id="effectiveFrom"
            type="date"
            value={values.effective_from}
            onChange={(e) => onChange({ effective_from: e.target.value })}
            error={errors.effective_from}
          />
        </div>
      </div>
    </div>
  );
}
