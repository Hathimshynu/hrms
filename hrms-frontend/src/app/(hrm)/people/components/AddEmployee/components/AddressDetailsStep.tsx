"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { useState } from "react";

const countries = [
  { label: "India", value: "india" },
  { label: "United States", value: "united_states" },
  { label: "United Kingdom", value: "united_kingdom" },
  { label: "Australia", value: "australia" },
];

const states = [
  { label: "Tamil Nadu", value: "tamil_nadu" },
  { label: "Kerala", value: "kerala" },
  { label: "Karnataka", value: "karnataka" },
  { label: "Maharashtra", value: "maharashtra" },
];

export function AddressDetailsStep() {
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);

  const [currentAddress, setCurrentAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const [permanentAddress, setPermanentAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const handleCurrentAddressChange = (
    field: keyof typeof currentAddress,
    value: any,
  ) => {
    setCurrentAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePermanentAddressChange = (
    field: keyof typeof permanentAddress,
    value: any,
  ) => {
    setPermanentAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSameAddressChange = (checked: boolean) => {
    setSameAsCurrentAddress(checked);

    if (checked) {
      setPermanentAddress({
        ...currentAddress,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Address */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          Current Address
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="currentAddressLine1"
              className="text-sm font-medium text-gray-700"
            >
              Address Line 1
            </label>

            <Input
              id="currentAddressLine1"
              name="currentAddressLine1"
              placeholder="Enter address line 1"
              value={currentAddress.addressLine1}
              onChange={(e) =>
                handleCurrentAddressChange("addressLine1", e.target.value)
              }
            />
          </div>

          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="currentAddressLine2"
              className="text-sm font-medium text-gray-700"
            >
              Address Line 2
            </label>

            <Input
              id="currentAddressLine2"
              name="currentAddressLine2"
              placeholder="Enter address line 2"
              value={currentAddress.addressLine2}
              onChange={(e) =>
                handleCurrentAddressChange("addressLine2", e.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="currentCity"
              className="text-sm font-medium text-gray-700"
            >
              City
            </label>

            <Input
              id="currentCity"
              name="currentCity"
              placeholder="Enter city"
              value={currentAddress.city}
              onChange={(e) =>
                handleCurrentAddressChange("city", e.target.value)
              }
            />
          </div>

          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="currentState"
              className="text-sm font-medium text-gray-700"
            >
              State
            </label>

            <Select
              id="currentState"
              name="currentState"
              placeholder="Select state"
              options={states}
              value={currentAddress.state}
              onChange={(value) => handleCurrentAddressChange("state", value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="currentCountry"
              className="text-sm font-medium text-gray-700"
            >
              Country
            </label>

            <Select
              id="currentCountry"
              name="currentCountry"
              placeholder="Select country"
              options={countries}
              value={currentAddress.country}
              onChange={(value) => handleCurrentAddressChange("country", value)}
            />
          </div>

          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="currentPostalCode"
              className="text-sm font-medium text-gray-700"
            >
              Postal Code
            </label>

            <Input
              id="currentPostalCode"
              name="currentPostalCode"
              placeholder="Enter postal code"
              value={currentAddress.postalCode}
              onChange={(e) =>
                handleCurrentAddressChange("postalCode", e.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* Permanent Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            Permanent Address
          </h3>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              id="sameAsCurrentAddress"
              name="sameAsCurrentAddress"
              checked={sameAsCurrentAddress}
              onChange={(e) => handleSameAddressChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />

            <span>Same as Current Address</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="permanentAddressLine1"
              className="text-sm font-medium text-gray-700"
            >
              Address Line 1
            </label>

            <Input
              id="permanentAddressLine1"
              name="permanentAddressLine1"
              placeholder="Enter address line 1"
              value={permanentAddress.addressLine1}
              onChange={(e) =>
                handlePermanentAddressChange("addressLine1", e.target.value)
              }
            />
          </div>

          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="permanentAddressLine2"
              className="text-sm font-medium text-gray-700"
            >
              Address Line 2
            </label>

            <Input
              id="permanentAddressLine2"
              name="permanentAddressLine2"
              placeholder="Enter address line 2"
              value={permanentAddress.addressLine2}
              onChange={(e) =>
                handlePermanentAddressChange("addressLine2", e.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="permanentCity"
              className="text-sm font-medium text-gray-700"
            >
              City
            </label>

            <Input
              id="permanentCity"
              name="permanentCity"
              placeholder="Enter city"
              value={permanentAddress.city}
              onChange={(e) =>
                handlePermanentAddressChange("city", e.target.value)
              }
            />
          </div>

          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="permanentState"
              className="text-sm font-medium text-gray-700"
            >
              State
            </label>

            <Select
              id="permanentState"
              name="permanentState"
              placeholder="Select state"
              options={states}
              value={permanentAddress.state}
              onChange={(value) => handlePermanentAddressChange("state", value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="permanentCountry"
              className="text-sm font-medium text-gray-700"
            >
              Country
            </label>

            <Select
              id="permanentCountry"
              name="permanentCountry"
              placeholder="Select country"
              options={countries}
              value={permanentAddress.country}
              onChange={(value) =>
                handlePermanentAddressChange("country", value)
              }
            />
          </div>

          <div className="space-y-2 grid gap-px">
            <label
              htmlFor="permanentPostalCode"
              className="text-sm font-medium text-gray-700"
            >
              Postal Code
            </label>

            <Input
              id="permanentPostalCode"
              name="permanentPostalCode"
              placeholder="Enter postal code"
              value={permanentAddress.postalCode}
              onChange={(e) =>
                handlePermanentAddressChange("postalCode", e.target.value)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
