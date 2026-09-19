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
import type { RoleDto, RolePayload } from "@/src/lib/roles/role.service";
import * as React from "react";

interface AddRoleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: RolePayload) => void;
  role?: RoleDto | null; // pass to edit, omit/null to add
  isSaving?: boolean;
  // Server-side (422) field errors from the last submit attempt, keyed by
  // backend field name (name).
  serverErrors?: Record<string, string>;
  // Non-field error (e.g. 409/500) from the last submit attempt.
  formError?: string | null;
}

const emptyForm = { name: "" };

export function AddRole({
  open,
  onOpenChange,
  onSave,
  role,
  isSaving = false,
  serverErrors,
  formError,
}: AddRoleProps) {
  const isEditMode = !!role;

  const [formData, setFormData] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    setFormData(role ? { name: role.name } : emptyForm);
    setErrors({});
  }, [role, open]);

  React.useEffect(() => {
    if (serverErrors) setErrors((prev) => ({ ...prev, ...serverErrors }));
  }, [serverErrors]);

  const handleChange = (value: string) => {
    setFormData({ name: value });
    if (errors.name) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Role name is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;

    onSave({ name: formData.name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className={"text-xl"}>
              {isEditMode ? "Edit Role" : "Add Role"}
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
              label="Role Name"
              placeholder="e.g. HR Manager"
              value={formData.name}
              onChange={(e) => handleChange(e.target.value)}
              error={errors.name}
              disabled={isSaving}
              autoFocus
            />
          </div>

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
              {isEditMode ? "Save Changes" : "Add Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
