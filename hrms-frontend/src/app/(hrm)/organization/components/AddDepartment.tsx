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
import type { DepartmentDto, DepartmentPayload } from "@/src/lib/departments/department.service";
import * as React from "react";

interface AddDepartmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: DepartmentPayload) => void;
  department?: DepartmentDto | null; // pass to edit, omit/null to add
  isSaving?: boolean;
  // Server-side (422) field errors from the last submit attempt, keyed by
  // backend field name (name, code, status, type, description).
  serverErrors?: Record<string, string>;
  // Non-field error (e.g. 409/500) from the last submit attempt.
  formError?: string | null;
}

const STATUS_OPTIONS: { label: string; value: DepartmentDto["status"] }[] = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Under Review", value: "Under Review" },
];

const TYPE_OPTIONS: { label: string; value: DepartmentDto["type"] }[] = [
  { label: "Technical", value: "Technical" },
  { label: "Non-Technical", value: "Non-Technical" },
  { label: "Administrative", value: "Administrative" },
];

const emptyForm = {
  name: "",
  code: "",
  status: "Active" as DepartmentDto["status"],
  type: "Technical" as DepartmentDto["type"],
  description: "",
};

export function AddDepartment({
  open,
  onOpenChange,
  onSave,
  department,
  isSaving = false,
  serverErrors,
  formError,
}: AddDepartmentProps) {
  const isEditMode = !!department;

  const [formData, setFormData] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset/populate the form whenever the dialog opens or the target
  // department changes (add vs edit).
  React.useEffect(() => {
    if (!open) return;
    if (department) {
      setFormData({
        name: department.name,
        code: department.code,
        status: department.status,
        type: department.type,
        description: department.description ?? "",
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [department, open]);

  // Surface 422 errors returned by the last submit attempt.
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
    if (!formData.name.trim()) nextErrors.name = "Department name is required";
    if (!formData.code.trim()) nextErrors.code = "Department code is required";
    if (!formData.type) nextErrors.type = "Department type is required";
    if (!formData.status) nextErrors.status = "Department status is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;

    onSave({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      status: formData.status,
      type: formData.type,
      description: formData.description.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className={"text-xl"}>
              {isEditMode ? "Edit Department" : "Add Department"}
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
              label="Department Name"
              placeholder="e.g. Information Technology"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              disabled={isSaving}
            />

            <Input
              label="Department Code"
              placeholder="e.g. IT"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              error={errors.code}
              disabled={isSaving}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Type"
                placeholder="Select type"
                options={TYPE_OPTIONS}
                value={formData.type}
                clearable={true}
                onChange={(value) => handleChange("type", value as string)}
                error={errors.type}
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
              placeholder="Short description of this department"
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
              {isEditMode ? "Save Changes" : "Add Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
