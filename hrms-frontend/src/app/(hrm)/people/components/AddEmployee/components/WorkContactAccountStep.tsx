"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";

const roles = [
  { label: "Employee", value: "employee" },
  { label: "Manager", value: "manager" },
  { label: "HR", value: "hr" },
  { label: "Admin", value: "admin" },
];

const accessLevels = [
  { label: "Basic", value: "basic" },
  { label: "Standard", value: "standard" },
  { label: "Manager", value: "manager" },
  { label: "Full Access", value: "full_access" },
];

export function WorkContactAccountStep() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="workEmail"
            className="text-sm font-medium text-gray-700"
          >
            Work Email
          </label>

          <Input
            id="workEmail"
            name="workEmail"
            type="email"
            placeholder="Enter work email"
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="workPhone"
            className="text-sm font-medium text-gray-700"
          >
            Work Phone
          </label>

          <Input
            id="workPhone"
            name="workPhone"
            type="tel"
            placeholder="Enter work phone"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2 grid gap-px">
          <label
            htmlFor="role"
            className="text-sm font-medium text-gray-700"
          >
            Role
          </label>

          <Select
            id="role"
            name="role"
            placeholder="Select role"
            options={roles}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="username"
            className="text-sm font-medium text-gray-700"
          >
            Username
          </label>

          <Input
            id="username"
            name="username"
            placeholder="Enter username"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
    

        <div className="space-y-2 grid gap-px">
          <label
            htmlFor="accessLevel"
            className="text-sm font-medium text-gray-700"
          >
            Access Level
          </label>

          <Select
            id="accessLevel"
            name="accessLevel"
            placeholder="Select access level"
            options={accessLevels}
          />
        </div>
      </div>
    </div>
  );
}