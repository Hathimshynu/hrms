"use client";

import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { useAuth } from "@/src/hooks/useAuth";
import { roleService, type RoleDto } from "@/src/lib/roles/role.service";
import { useEffect, useState } from "react";
import type { StepProps, WorkContactValues } from "../onboarding-form.types";

// access_level enum, hrms-backend SaveEmployeeDraftRequest::stepThreeRules.
const accessLevels = [
  { label: "Organization", value: "Organization" },
  { label: "Branch", value: "Branch" },
  { label: "Department", value: "Department" },
  { label: "Team", value: "Team" },
  { label: "Self", value: "Self" },
];

export function WorkContactAccountStep({ values, onChange, errors }: StepProps<WorkContactValues>) {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  // UX only: the backend enforces role assignment; do not offer Super Admin to non-Super Admins.
  const { user: actor } = useAuth();
  const isSuperAdmin = actor?.roles?.includes("Super Admin") ?? false;

  useEffect(() => {
    roleService
      .list()
      .then(setRoles)
      .catch(() => setRolesError("You don't have permission to view roles."));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="workEmail" className="text-sm font-medium text-gray-700">
            Work Email
          </label>
          <Input
            id="workEmail"
            type="email"
            placeholder="Enter work email"
            value={values.work_email}
            onChange={(e) => onChange({ work_email: e.target.value })}
            error={errors.work_email}
          />
          <p className="text-xs text-gray-400">This becomes the employee&apos;s login email.</p>
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="workPhone" className="text-sm font-medium text-gray-700">
            Work Phone
          </label>
          <Input
            id="workPhone"
            type="tel"
            placeholder="Enter work phone"
            value={values.work_phone}
            onChange={(e) => onChange({ work_phone: e.target.value })}
            error={errors.work_phone}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 grid gap-px">
          <label htmlFor="role" className="text-sm font-medium text-gray-700">
            Role
          </label>
          <Select
            id="role"
            placeholder={rolesError ? "Unavailable" : "Select role"}
            options={roles
              .filter((r) => r.name !== "Super Admin" || isSuperAdmin)
              .map((r) => ({ label: r.name, value: String(r.id) }))}
            value={values.role_id}
            clearable
            disabled={!!rolesError}
            onChange={(v) => onChange({ role_id: v as string })}
            error={errors.role_id || rolesError || undefined}
          />
        </div>

        <div className="space-y-2 grid gap-px">
          <label htmlFor="accessLevel" className="text-sm font-medium text-gray-700">
            Access Level
          </label>
          <Select
            id="accessLevel"
            placeholder="Select access level"
            options={accessLevels}
            value={values.access_level}
            clearable
            onChange={(v) => onChange({ access_level: v as string })}
            error={errors.access_level}
          />
        </div>
      </div>
    </div>
  );
}
