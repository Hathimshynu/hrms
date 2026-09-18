"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";

const banks = [
  { label: "State Bank of India", value: "sbi" },
  { label: "HDFC Bank", value: "hdfc" },
  { label: "ICICI Bank", value: "icici" },
  { label: "Axis Bank", value: "axis" },
  { label: "Kotak Mahindra Bank", value: "kotak" },
  { label: "Other", value: "other" },
];

const accountTypes = [
  { label: "Savings", value: "savings" },
  { label: "Current", value: "current" },
];

export function BankPayrollStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="bankName"
            className="text-sm font-medium text-gray-700"
          >
            Bank Name
          </label>

          <Select
            id="bankName"
            name="bankName"
            placeholder="Select bank"
            options={banks}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="accountHolderName"
            className="text-sm font-medium text-gray-700"
          >
            Account Holder Name
          </label>

          <Input
            id="accountHolderName"
            name="accountHolderName"
            placeholder="Enter account holder name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="accountNumber"
            className="text-sm font-medium text-gray-700"
          >
            Account Number
          </label>

          <Input
            id="accountNumber"
            name="accountNumber"
            type="password"
            placeholder="Enter account number"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="ifscCode"
            className="text-sm font-medium text-gray-700"
          >
            IFSC Code
          </label>

          <Input
            id="ifscCode"
            name="ifscCode"
            placeholder="Enter IFSC code"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="accountType"
            className="text-sm font-medium text-gray-700"
          >
            Account Type
          </label>

          <Select
            id="accountType"
            name="accountType"
            placeholder="Select account type"
            options={accountTypes}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="taxIdPan"
            className="text-sm font-medium text-gray-700"
          >
            Tax ID / PAN
          </label>

          <Input
            id="taxIdPan"
            name="taxIdPan"
            placeholder="Enter PAN number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="uan"
            className="text-sm font-medium text-gray-700"
          >
            UAN
          </label>

          <Input
            id="uan"
            name="uan"
            placeholder="Enter UAN"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="pfNumber"
            className="text-sm font-medium text-gray-700"
          >
            PF Number
          </label>

          <Input
            id="pfNumber"
            name="pfNumber"
            placeholder="Enter PF number"
          />
        </div>
      </div>
    </div>
  );
}