"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

interface InlineBannerProps {
  type: "success" | "error";
  message: string;
}

// Lightweight page-level feedback banner (list-load errors, save
// success). No toast library is installed in this project - this reuses
// the same inline-alert style already used by LoginForm/ForgotPasswordForm.
export function InlineBanner({ type, message }: InlineBannerProps) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
        isSuccess
          ? "border-green-500/25 bg-green-50 text-green-600"
          : "border-red-500/25 bg-red-50 text-red-600"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
