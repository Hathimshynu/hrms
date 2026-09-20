"use client";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import type { LeaveBalance } from "@/src/lib/leave/leave.types";

interface Props {
  balance: LeaveBalance | null;
  isLoading: boolean;
  error: string | null;
}

// Usage per leave type for the year, derived by the backend from real leave
// requests. The leave policy master has no entitlement field, so allocated
// and available balances are not available and are not shown.
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
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted">Approved (used)</dt>
                      <dd className="text-2xl font-semibold text-ink">{t.used}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Pending</dt>
                      <dd className="text-2xl font-semibold text-ink">{t.pending}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            {!balance.allocation_configured && (
              <p className="text-xs text-muted">
                Leave entitlements are not configured in the leave policy, so remaining balance cannot be calculated.
                Days shown are approved and pending working days.
              </p>
            )}
          </>
        )
      )}
    </section>
  );
}
