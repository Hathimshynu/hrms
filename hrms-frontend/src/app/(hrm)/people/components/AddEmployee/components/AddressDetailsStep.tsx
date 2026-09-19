"use client";

import { Input } from "@/src/components/ui/Input";
import type { AddressBlock, AddressValues, StepProps } from "../onboarding-form.types";

// No country/state master exists in the backend (verified - only city is
// free text in the original mock too), so these are plain text fields
// rather than a fabricated dropdown of options.
function AddressFields({
  prefix,
  block,
  onChange,
  errors,
  disabled,
}: {
  prefix: "current" | "permanent";
  block: AddressBlock;
  onChange: (field: keyof AddressBlock, value: string) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}) {
  const errorFor = (field: string) => errors[`${prefix}_address.${field}`];

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Address Line 1</label>
          <Input
            placeholder="Enter address line 1"
            value={block.address_line_1}
            onChange={(e) => onChange("address_line_1", e.target.value)}
            error={errorFor("address_line_1")}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Address Line 2</label>
          <Input
            placeholder="Enter address line 2"
            value={block.address_line_2}
            onChange={(e) => onChange("address_line_2", e.target.value)}
            error={errorFor("address_line_2")}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">City</label>
          <Input
            placeholder="Enter city"
            value={block.city}
            onChange={(e) => onChange("city", e.target.value)}
            error={errorFor("city")}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">State</label>
          <Input
            placeholder="Enter state"
            value={block.state}
            onChange={(e) => onChange("state", e.target.value)}
            error={errorFor("state")}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Country</label>
          <Input
            placeholder="Enter country"
            value={block.country}
            onChange={(e) => onChange("country", e.target.value)}
            error={errorFor("country")}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2 grid gap-px">
          <label className="text-sm font-medium text-gray-700">Postal Code</label>
          <Input
            placeholder="Enter postal code"
            value={block.postal_code}
            onChange={(e) => onChange("postal_code", e.target.value)}
            error={errorFor("postal_code")}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
}

export function AddressDetailsStep({ values, onChange, errors }: StepProps<AddressValues>) {
  const updateCurrent = (field: keyof AddressBlock, value: string) => {
    const nextCurrent = { ...values.current_address, [field]: value };
    onChange({
      current_address: nextCurrent,
      ...(values.same_as_current ? { permanent_address: nextCurrent } : {}),
    });
  };

  const updatePermanent = (field: keyof AddressBlock, value: string) => {
    onChange({ permanent_address: { ...values.permanent_address, [field]: value } });
  };

  const handleSameAddressChange = (checked: boolean) => {
    onChange({
      same_as_current: checked,
      ...(checked ? { permanent_address: { ...values.current_address } } : {}),
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Current Address</h3>
        <AddressFields
          prefix="current"
          block={values.current_address}
          onChange={updateCurrent}
          errors={errors}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Permanent Address</h3>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={values.same_as_current}
              onChange={(e) => handleSameAddressChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span>Same as Current Address</span>
          </label>
        </div>

        <AddressFields
          prefix="permanent"
          block={values.permanent_address}
          onChange={updatePermanent}
          errors={errors}
          disabled={values.same_as_current}
        />
      </div>
    </div>
  );
}
