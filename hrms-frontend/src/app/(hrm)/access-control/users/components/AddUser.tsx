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
import { Switch } from "@/src/components/ui/Switch";
import type { RoleDto } from "@/src/lib/roles/role.service";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserDto,
} from "@/src/lib/users/user.service";
import * as React from "react";

interface AddUserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: CreateUserPayload | UpdateUserPayload) => void;
  user?: UserDto | null; // pass to edit, omit/null to add
  roles: RoleDto[];
  rolesError?: string | null;
  isSaving?: boolean;
  // Server-side (422) field errors from the last submit attempt, keyed by
  // backend field name (name, email, password, role_id).
  serverErrors?: Record<string, string>;
  // Non-field error (e.g. 409/500) from the last submit attempt.
  formError?: string | null;
}

const emptyForm = {
  name: "",
  email: "",
  role_id: "",
  is_active: true,
  password: "",
  password_confirmation: "",
};

export function AddUser({
  open,
  onOpenChange,
  onSave,
  user,
  roles,
  rolesError,
  isSaving = false,
  serverErrors,
  formError,
}: AddUserProps) {
  const isEditMode = !!user;

  const [formData, setFormData] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  // Edit mode only: keep the password fields hidden until the admin
  // explicitly opts to change it - backend leaves the current password in
  // place when password isn't sent.
  const [changePassword, setChangePassword] = React.useState(false);

  // Reset/populate the form whenever the dialog opens or the target user
  // changes (add vs edit).
  React.useEffect(() => {
    if (!open) return;
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role_id: user.role ? String(user.role.id) : "",
        is_active: user.is_active,
        password: "",
        password_confirmation: "",
      });
      setChangePassword(false);
    } else {
      setFormData(emptyForm);
      setChangePassword(false);
    }
    setErrors({});
  }, [user, open]);

  // Surface 422 errors returned by the last submit attempt.
  React.useEffect(() => {
    if (serverErrors) setErrors((prev) => ({ ...prev, ...serverErrors }));
  }, [serverErrors]);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const wantsPassword = !isEditMode || changePassword;

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Name is required";
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    if (!formData.role_id) nextErrors.role_id = "Role is required";

    if (wantsPassword) {
      if (!formData.password) {
        nextErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        nextErrors.password = "Password must be at least 8 characters long";
      }
      if (!formData.password_confirmation) {
        nextErrors.password_confirmation = "Please confirm the password";
      } else if (formData.password && formData.password !== formData.password_confirmation) {
        nextErrors.password_confirmation = "Passwords do not match";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;

    if (isEditMode) {
      const payload: UpdateUserPayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role_id: Number(formData.role_id),
        is_active: formData.is_active,
      };
      if (changePassword) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }
      onSave(payload);
    } else {
      onSave({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role_id: Number(formData.role_id),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className={"text-xl"}>
              {isEditMode ? "Edit User" : "Add User"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-6 max-h-[70vh] overflow-y-auto">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {formError}
              </div>
            )}

            <Input
              label="Full Name"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              disabled={isSaving}
            />

            <Input
              label="Email"
              type="email"
              placeholder="e.g. jane.doe@company.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              disabled={isSaving}
            />

            <Select
              label="Role"
              placeholder={rolesError ? "Unavailable" : "Select role"}
              options={roles.map((r) => ({ label: r.name, value: String(r.id) }))}
              value={formData.role_id}
              clearable
              disabled={isSaving || !!rolesError}
              onChange={(v) => handleChange("role_id", v as string)}
              error={errors.role_id || rolesError || undefined}
            />

            {isEditMode && (
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Active</p>
                  <p className="text-xs text-muted">
                    Inactive users cannot log in.
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onChange={(checked) => handleChange("is_active", checked)}
                  disabled={isSaving}
                  ariaLabel="Active"
                />
              </div>
            )}

            {isEditMode && (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) {
                      setFormData((prev) => ({
                        ...prev,
                        password: "",
                        password_confirmation: "",
                      }));
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.password;
                        delete next.password_confirmation;
                        return next;
                      });
                    }
                  }}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Set a new password
              </label>
            )}

            {wantsPassword && (
              <>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  error={errors.password}
                  disabled={isSaving}
                />
                <p className="-mt-3 text-xs text-muted">
                  Must include uppercase, lowercase, a number, and a symbol.
                </p>

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.password_confirmation}
                  onChange={(e) => handleChange("password_confirmation", e.target.value)}
                  error={errors.password_confirmation}
                  disabled={isSaving}
                />
              </>
            )}
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
              {isEditMode ? "Save Changes" : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
