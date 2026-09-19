"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import type { BankValues, StepProps } from "../onboarding-form.types";

const accountTypes = [
  { label: "Savings", value: "savings" },
  { label: "Current", value: "current" },
];

export function BankPayrollStep({ values, onChange, errors }: StepProps<BankValues>) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="bankName" className="text-sm font-medium text-gray-700">
            Bank Name
          </label>
          <Input
            id="bankName"
            placeholder="Enter bank name"
            value={values.bank_name}
            onChange={(e) => onChange({ bank_name: e.target.value })}
            error={errors.bank_name}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="accountHolderName" className="text-sm font-medium text-gray-700">
            Account Holder Name
          </label>
          <Input
            id="accountHolderName"
            placeholder="Enter account holder name"
            value={values.account_holder_name}
            onChange={(e) => onChange({ account_holder_name: e.target.value })}
            error={errors.account_holder_name}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="accountNumber" className="text-sm font-medium text-gray-700">
            Account Number
          </label>
          <Input
            id="accountNumber"
            type="password"
            placeholder="Enter account number"
            value={values.account_number}
            onChange={(e) => onChange({ account_number: e.target.value })}
            error={errors.account_number}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="ifscCode" className="text-sm font-medium text-gray-700">
            IFSC Code
          </label>
          <Input
            id="ifscCode"
            placeholder="Enter IFSC code"
            value={values.ifsc_code}
            onChange={(e) => onChange({ ifsc_code: e.target.value.toUpperCase() })}
            error={errors.ifsc_code}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="accountType" className="text-sm font-medium text-gray-700">
            Account Type
          </label>
          <Select
            id="accountType"
            placeholder="Select account type"
            options={accountTypes}
            value={values.account_type}
            clearable
            onChange={(v) => onChange({ account_type: v as string })}
            error={errors.account_type}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="taxIdPan" className="text-sm font-medium text-gray-700">
            PAN
          </label>
          <Input
            id="taxIdPan"
            placeholder="Enter PAN number"
            value={values.pan}
            onChange={(e) => onChange({ pan: e.target.value.toUpperCase() })}
            error={errors.pan}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="uan" className="text-sm font-medium text-gray-700">
            UAN
          </label>
          <Input
            id="uan"
            placeholder="Enter UAN"
            value={values.uan}
            onChange={(e) => onChange({ uan: e.target.value })}
            error={errors.uan}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="pfNumber" className="text-sm font-medium text-gray-700">
            PF Number
          </label>
          <Input
            id="pfNumber"
            placeholder="Enter PF number"
            value={values.pf_number}
            onChange={(e) => onChange({ pf_number: e.target.value })}
            error={errors.pf_number}
          />
        </div>
      </div>
    </div>
  );
}
