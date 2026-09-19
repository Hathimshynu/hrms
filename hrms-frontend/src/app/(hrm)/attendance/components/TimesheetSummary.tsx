"use client";

import { format } from "date-fns";
import * as React from "react";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { parseApiError } from "@/src/lib/api/errors";
import { attendanceService } from "@/src/lib/attendance/attendance.service";
import type { TimesheetResponse } from "@/src/lib/attendance/attendance.types";

// Monthly totals straight from GET /attendance/timesheet (no client-side math).
export function TimesheetSummary({ month }: { month: Date }) {
  const key = format(month, "yyyy-MM");
  const [data, setData] = React.useState<TimesheetResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loadedKey, setLoadedKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    attendanceService
      .timesheet(key)
      .then((res) => {
        if (!active) return;
        setData(res);
        setError(null);
        setLoadedKey(key);
      })
      .catch((err) => {
        if (!active) return;
        setError(parseApiError(err, "Failed to load the monthly summary.").message);
        setLoadedKey(key);
      });
    return () => {
      active = false;
    };
  }, [key]);

  const loading = loadedKey !== key;
  const items = data
    ? [
        ["Present days", data.present_days],
        ["Late days", data.late_days],
        ["Half days", data.half_days],
        ["Leave days", data.leave_days],
        ["Work hours", data.total_work_hours],
        ["Overtime hours", data.total_overtime_hours],
      ]
    : [];

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6" aria-labelledby="ts-title">
      <h2 id="ts-title" className="text-lg font-semibold text-ink">
        Monthly summary · {format(month, "MMMM yyyy")}
      </h2>
      {error && <div className="mt-3"><InlineBanner type="error" message={error} /></div>}
      {loading ? (
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-black/5" aria-hidden="true" />
      ) : (
        !error && (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {items.map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-surface-muted px-3 py-3">
                <dt className="text-xs text-ink-soft">{label}</dt>
                <dd className="mt-1 text-xl font-bold text-ink tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )
      )}
    </section>
  );
}
