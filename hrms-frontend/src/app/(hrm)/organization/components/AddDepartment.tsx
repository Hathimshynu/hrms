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

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  headAvatar?: string;
  employeeCount: number;
  status: "Active" | "Inactive" | "Under Review";
  type: "Technical" | "Non-Technical" | "Administrative";
}

interface AddDepartmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Department, "id"> & { id?: string }) => void;
  department?: Department | null; // pass to edit, omit/null to add
}

const STATUS_OPTIONS: { label: string; value: Department["status"] }[] = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Under Review", value: "Under Review" },
];

const TYPE_OPTIONS: { label: string; value: Department["type"] }[] = [
  { label: "Technical", value: "Technical" },
  { label: "Non-Technical", value: "Non-Technical" },
  { label: "Administrative", value: "Administrative" },
];

const emptyForm = {
  name: "",
  code: "",
  head: "",
  employeeCount: "",
  status: "Active" as Department["status"],
  type: "Technical" as Department["type"],
};

export function AddDepartment({
  open,
  onOpenChange,
  onSave,
  department,
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
        head: department.head,
        employeeCount: String(department.employeeCount),
        status: department.status,
        type: department.type,
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [department, open]);

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
    if (!formData.head.trim()) nextErrors.head = "Department head is required";
    if (formData.employeeCount === "" || Number(formData.employeeCount) < 0)
      nextErrors.employeeCount = "Enter a valid employee count";
    if (!formData.type) nextErrors.type = "Department type is required";
    if (!formData.status) nextErrors.status = "Department status is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...(isEditMode && department ? { id: department.id } : {}),
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      head: formData.head.trim(),
      employeeCount: Number(formData.employeeCount),
      status: formData.status,
      type: formData.type,
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
            <Input
              label="Department Name"
              placeholder="e.g. Information Technology"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
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
              {isEditMode ? "Save Changes" : "Add Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
