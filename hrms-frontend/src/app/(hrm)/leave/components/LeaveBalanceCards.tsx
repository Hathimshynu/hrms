"use client";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import type { LeaveBalance } from "@/src/lib/leave/leave.types";

interface Props {
  balance: LeaveBalance | null;
  isLoading: boolean;
  error: string | null;
}

const n = (v: number) => String(Number.isInteger(v) ? v : Number(v.toFixed(2)));

// Balance per leave type for the year. Entitlement is set by HR/Admin; where
// none is configured the card says so instead of showing 0, because 0 would
// read as "this employee is entitled to zero days".
// Remaining = entitlement - approved. Pending days are shown separately and
// do not reduce Remaining until they are approved.
export function LeaveBalanceCards({ balance, isLoading, error }: Props) {
  return (
    <section className="grid gap-3" aria-labelledby="leave-balance-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="leave-balance-title" className="text-lg font-semibold text-ink">
          Leave balance{balance ? ` — ${balance.year}` : ""}
        </h2>
      </div>

      {error && <InlineBanner type="error" message={error} />}

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-black/5" aria-hidden="true" />
      ) : balance && balance.types.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface py-8 text-center text-sm text-muted">
          No leave types are configured yet.
        </p>
      ) : (
        balance && (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {balance.types.map((t) => (
                <li key={t.leave_type} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    {!t.configured && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        Not configured
                      </span>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted">Entitlement</dt>
                      <dd className="text-2xl font-semibold text-ink">
                        {t.allocated === null ? <span className="text-base font-medium text-muted">Not configured</span> : n(t.allocated)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Approved</dt>
                      <dd className="text-2xl font-semibold text-ink">{n(t.used)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Pending</dt>
                      <dd className="text-2xl font-semibold text-ink">{n(t.pending)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Remaining</dt>
                      <dd className="text-2xl font-semibold text-ink">
                        {t.available === null ? <span className="text-base font-medium text-muted">Not configured</span> : n(t.available)}
                      </dd>
                    </div>
                  </dl>
                  {t.configured && t.pending > 0 && t.available_after_pending !== null && (
                    <p className="mt-2 text-xs text-muted">
                      {n(t.available_after_pending)} day(s) would remain if all pending requests are approved.
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              Remaining = entitlement − approved days. Pending days are not deducted until approved. Days exclude weekly offs and holidays.
              {!balance.allocation_configured && " No entitlement is configured for you this year; contact HR before applying for leave."}
            </p>
          </>
        )
      )}
    </section>
  );
}
