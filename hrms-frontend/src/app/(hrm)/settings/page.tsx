"use client";

import { formatDate } from "@/src/lib/date/format";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { UserAvatar } from "@/src/components/common/UserAvatar";
import { useAuth } from "@/src/hooks/useAuth";

// Profile information: only what GET /api/me actually returns. The backend
// has no profile-update or photo-upload endpoint, so this page is read-only
// (name/email are managed by HR under Employees / Users).

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value || "-"}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-8 text-sm text-muted" role="status">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <UserAvatar name={user.name} className="size-16 text-xl" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-ink">{user.name}</h1>
          <p className="flex items-center gap-1.5 truncate text-sm text-ink-soft">
            <Mail className="size-3.5 shrink-0" /> {user.email}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-dark">
            <UserRound className="size-3" /> {user.roles?.[0] ?? "No role"}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink">Profile information</h2>
        <dl className="mt-2">
          <Row label="Full name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Role" value={user.roles?.join(", ")} />
          <Row label="Member since" value={formatDate(user.created_at)} />
        </dl>
        <p className="mt-3 text-xs text-muted">
          Name and email are managed by your HR administrator.
        </p>
      </section>

      <Link
        href="/settings/account"
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md sm:p-6"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
          <ShieldCheck className="size-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">Account &amp; security</span>
          <span className="block text-xs text-ink-soft">Change your password and review sign-in activity</span>
        </span>
      </Link>
    </div>
  );
}
