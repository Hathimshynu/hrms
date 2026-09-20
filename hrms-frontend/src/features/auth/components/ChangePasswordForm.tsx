// src/features/auth/components/ChangePasswordForm.tsx
"use client";

import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/src/components/ui/Button";
import { PasswordInput } from "@/src/components/ui/PasswordInput";
import { authService } from "@/src/lib/auth/auth.service";
import { useAuthStore } from "@/src/store/auth.store";

const PASSWORD_RULE_HINT =
  "At least 8 characters, with upper & lower case letters, a number and a symbol.";

function isStrongEnough(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

interface ChangePasswordFormProps {
  forced?: boolean;
  // Inside the profile page: no "sign out" escape, stay on the page after success.
  embedded?: boolean;
}

export function ChangePasswordForm({ forced = false, embedded = false }: ChangePasswordFormProps) {
  const router = useRouter();
  const { fetchCurrentUser, logout } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess(false);
    setFieldErrors({});

    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.current_password = "Current password is required";
    if (!isStrongEnough(newPassword)) nextErrors.new_password = PASSWORD_RULE_HINT;
    if (newPassword !== confirmPassword)
      nextErrors.new_password_confirmation = "Passwords do not match";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      await fetchCurrentUser();
      if (embedded) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      if (!isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)) {
        setFormError("Failed to change password. Please try again.");
        return;
      }

      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 422 && data?.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(data.errors)) {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        }
        setFieldErrors(mapped);
      } else {
        setFormError(data?.message ?? "Failed to change password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5">
      {forced && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
        >
          You must change your temporary password before continuing.
        </div>
      )}

      {success && (
        <div role="status" className="rounded-xl border border-green-500/25 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Password updated successfully.
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
        >
          {formError}
        </div>
      )}

      <div className="grid gap-5">
        <PasswordInput
          id="current_password"
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={fieldErrors.current_password}
        />

        <PasswordInput
          id="new_password"
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={fieldErrors.new_password}
        />

        <PasswordInput
          id="new_password_confirmation"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.new_password_confirmation}
        />

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? "Changing password..." : "Change password"}
        </Button>

        {!forced && !embedded && (
          <button
            type="button"
            onClick={() => logout().then(() => router.push("/login"))}
            className="w-full text-sm font-semibold text-gray-600 hover:text-black transition-colors text-center py-2"
          >
            Cancel and sign out
          </button>
        )}
      </div>
    </form>
  );
}
