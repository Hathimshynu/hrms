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
import * as React from "react";

export interface Designation {
  id: string;
  name: string;
  code: string;
  department: string;
  employeeCount: number;
  status: "Active" | "Inactive" | "Under Review";
  level: "Entry" | "Mid" | "Senior" | "Lead" | "Manager";
}

interface AddDesignationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Designation, "id"> & { id?: string }) => void;
  designation?: Designation | null; // pass to edit, omit/null to add
  departments: string[]; // list of departments for dropdown
}

const STATUS_OPTIONS: { label: string; value: Designation["status"] }[] = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Under Review", value: "Under Review" },
];

const LEVEL_OPTIONS: { label: string; value: Designation["level"] }[] = [
  { label: "Entry", value: "Entry" },
  { label: "Mid", value: "Mid" },
  { label: "Senior", value: "Senior" },
  { label: "Lead", value: "Lead" },
  { label: "Manager", value: "Manager" },
];

const emptyForm = {
  name: "",
  code: "",
  department: "",
  employeeCount: "",
  status: "Active" as Designation["status"],
  level: "Entry" as Designation["level"],
};

export function AddDesignation({
  open,
  onOpenChange,
  onSave,
  designation,
  departments,
}: AddDesignationProps) {
  const isEditMode = !!designation;

  const [formData, setFormData] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset/populate the form whenever the dialog opens or the target
  // designation changes (add vs edit).
  React.useEffect(() => {
    if (!open) return;
    if (designation) {
      setFormData({
        name: designation.name,
        code: designation.code,
        department: designation.department,
        employeeCount: String(designation.employeeCount),
        status: designation.status,
        level: designation.level,
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [designation, open]);

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
    if (!formData.department.trim())
      nextErrors.department = "Department is required";
    if (formData.employeeCount === "" || Number(formData.employeeCount) < 0)
      nextErrors.employeeCount = "Enter a valid employee count";
    if (!formData.level) nextErrors.level = "Level is required";
    if (!formData.status) nextErrors.status = "Status is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...(isEditMode && designation ? { id: designation.id } : {}),
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      department: formData.department.trim(),
      employeeCount: Number(formData.employeeCount),
      status: formData.status,
      level: formData.level,
    });
  };

  // Convert departments to options format
  const departmentOptions = departments.map((dept) => ({
    label: dept,
    value: dept,
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
            <Input
              label="Designation Name"
              placeholder="e.g. Software Engineer"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
            />

            <Select
              label="Department"
              placeholder="Select department"
              options={departmentOptions}
              value={formData.department}
              clearable={true}
              onChange={(value) => handleChange("department", value as string)}
              error={errors.department}
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

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Save Changes" : "Add Designation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
