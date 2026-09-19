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
import type {
  PermissionDto,
  PermissionPayload,
} from "@/src/lib/permissions/permission.service";
import * as React from "react";

interface AddPermissionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: PermissionPayload) => void;
  permission?: PermissionDto | null; // pass to edit, omit/null to add
  isSaving?: boolean;
  // Known modules from GET /api/permissions/modules - offered as
  // suggestions via a datalist so a new module can still be typed freely
  // (module is a plain string on the backend, not an enum).
  moduleSuggestions?: string[];
  // Server-side (422) field errors from the last submit attempt, keyed by
  // backend field name (name, module, action).
  serverErrors?: Record<string, string>;
  // Non-field error (e.g. duplicate module+action, 500) from the last
  // submit attempt.
  formError?: string | null;
}

const emptyForm = { name: "", module: "", action: "" };

export function AddPermission({
  open,
  onOpenChange,
  onSave,
  permission,
  isSaving = false,
  moduleSuggestions = [],
  serverErrors,
  formError,
}: AddPermissionProps) {
  const isEditMode = !!permission;

  const [formData, setFormData] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    if (permission) {
      setFormData({
        name: permission.name,
        module: permission.module,
        action: permission.action,
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [permission, open]);

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
    if (!formData.name.trim()) nextErrors.name = "Permission name is required";
    if (!formData.module.trim()) nextErrors.module = "Module is required";
    if (!formData.action.trim()) nextErrors.action = "Action is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;

    onSave({
      name: formData.name.trim(),
      module: formData.module.trim(),
      action: formData.action.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className={"text-xl"}>
              {isEditMode ? "Edit Permission" : "Add Permission"}
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
              label="Permission Name"
              placeholder="e.g. view employees"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              disabled={isSaving}
              autoFocus
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Module"
                placeholder="e.g. employees"
                list="permission-module-suggestions"
                value={formData.module}
                onChange={(e) => handleChange("module", e.target.value)}
                error={errors.module}
                disabled={isSaving}
              />

              <Input
                label="Action"
                placeholder="e.g. view"
                value={formData.action}
                onChange={(e) => handleChange("action", e.target.value)}
                error={errors.action}
                disabled={isSaving}
              />
            </div>

            {moduleSuggestions.length > 0 && (
              <datalist id="permission-module-suggestions">
                {moduleSuggestions.map((module) => (
                  <option key={module} value={module} />
                ))}
              </datalist>
            )}
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
              {isEditMode ? "Save Changes" : "Add Permission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
