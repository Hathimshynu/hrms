"use client";

import { Button } from "@/src/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";
import type { DepartmentDto } from "@/src/lib/departments/department.service";
import type { DesignationDto, DesignationPayload } from "@/src/lib/designations/designation.service";
import * as React from "react";

interface AddDesignationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: DesignationPayload) => void;
  designation?: DesignationDto | null; // pass to edit, omit/null to add
  departments: DepartmentDto[]; // real departments for the dropdown
  isSaving?: boolean;
  // Server-side (422) field errors from the last submit attempt.
  serverErrors?: Record<string, string>;
  // Non-field error (e.g. 409/500) from the last submit attempt.
  formError?: string | null;
}

const STATUS_OPTIONS: { label: string; value: DesignationDto["status"] }[] = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Under Review", value: "Under Review" },
];

const LEVEL_OPTIONS: { label: string; value: DesignationDto["level"] }[] = [
  { label: "Entry", value: "Entry" },
  { label: "Mid", value: "Mid" },
  { label: "Senior", value: "Senior" },
  { label: "Lead", value: "Lead" },
  { label: "Manager", value: "Manager" },
];

const emptyForm = {
  name: "",
  code: "",
  department_id: "",
  status: "Active" as DesignationDto["status"],
  level: "Entry" as DesignationDto["level"],
  description: "",
};

export function AddDesignation({
  open,
  onOpenChange,
  onSave,
  designation,
  departments,
  isSaving = false,
  serverErrors,
  formError,
}: AddDesignationProps) {
  const isEditMode = !!designation;

  const [formData, setFormData] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    if (designation) {
      setFormData({
        name: designation.name,
        code: designation.code,
        department_id: String(designation.department_id),
        status: designation.status,
        level: designation.level,
        description: designation.description ?? "",
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [designation, open]);

  React.useEffect(() => {
    if (serverErrors) setErrors((prev) => ({ ...prev, ...serverErrors }));
  }, [serverErrors]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Designation name is required";
    if (!formData.code.trim()) nextErrors.code = "Designation code is required";
    if (!formData.department_id) nextErrors.department_id = "Department is required";
    if (!formData.level) nextErrors.level = "Level is required";
    if (!formData.status) nextErrors.status = "Status is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;

    onSave({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      department_id: Number(formData.department_id),
      status: formData.status,
      level: formData.level,
      description: formData.description.trim() || null,
    });
  };

  const departmentOptions = departments.map((dept) => ({
    label: dept.name,
    value: String(dept.id),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className="text-xl">
              {isEditMode ? "Edit Designation" : "Add Designation"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-6">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {formError}
              </div>
            )}

            <Input
              label="Designation Name"
              placeholder="e.g. Software Engineer"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              disabled={isSaving}
            />

            <Input
              label="Designation Code"
              placeholder="e.g. SE"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              error={errors.code}
              disabled={isSaving}
            />

            <Select
              label="Department"
              placeholder="Select department"
              options={departmentOptions}
              value={formData.department_id}
              clearable={true}
              onChange={(value) => handleChange("department_id", value as string)}
              error={errors.department_id}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Level"
                placeholder="Select level"
                options={LEVEL_OPTIONS}
                value={formData.level}
                clearable={true}
                onChange={(value) => handleChange("level", value as string)}
                error={errors.level}
              />

              <Select
                label="Status"
                placeholder="Select status"
                options={STATUS_OPTIONS}
                value={formData.status}
                clearable={true}
                onChange={(value) => handleChange("status", value as string)}
                error={errors.status}
              />
            </div>

            <Textarea
              label="Description (optional)"
              placeholder="Short description of this designation"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              error={errors.description}
              disabled={isSaving}
            />
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {isEditMode ? "Save Changes" : "Add Designation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
