"use client";

import { formatDateTime } from "@/src/lib/date/format";
import { useAuth } from "@/src/hooks/useAuth";
import { ChangePasswordForm } from "@/src/features/auth/components/ChangePasswordForm";

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h1 className="text-base font-semibold text-ink">Sign-in activity</h1>
        <dl className="mt-2 text-sm">
          <div className="flex flex-col gap-0.5 border-b border-border/60 py-3 sm:flex-row sm:justify-between">
            <dt className="text-ink-soft">Last sign-in</dt>
            <dd className="font-medium text-ink">{formatDateTime(user?.last_login_at)}</dd>
          </div>
          <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between">
            <dt className="text-ink-soft">Last sign-in IP</dt>
            <dd className="font-medium text-ink">{user?.last_login_ip ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Change password</h2>
        <ChangePasswordForm embedded />
      </section>
    </div>
  );
}
