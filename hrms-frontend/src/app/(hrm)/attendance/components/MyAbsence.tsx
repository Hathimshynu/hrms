"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import * as React from "react";

import { ExportMenu } from "@/src/components/common/ExportMenu";
import { downloadServerExport } from "@/src/lib/export/download";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { StatusPill } from "@/src/components/ui/Datatable";
import { parseApiError } from "@/src/lib/api/errors";
import {
  ABSENCE_LABELS,
  absenceService,
  type AbsenceSelfResponse,
  type AbsenceStatus,
} from "@/src/lib/attendance/absence.service";
import { formatDate } from "@/src/lib/date/format";

const SUMMARY_ORDER: AbsenceStatus[] = ["present", "absent", "leave", "weekly_off", "upcoming"];

// Self-service absence for the month shown in the attendance calendar. All
// values are derived by the backend from attendance, weekly offs and approved
// leave; holidays are not represented in the schema so none are shown.
export function MyAbsence({ month }: { month: Date }) {
  const [data, setData] = React.useState<AbsenceSelfResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const from = format(startOfMonth(month), "yyyy-MM-dd");
  const to = format(endOfMonth(month), "yyyy-MM-dd");

  React.useEffect(() => {
    let active = true;
    setIsLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);
    absenceService
      .mine({ from_date: from, to_date: to })
      .then((res) => active && setData(res))
      .catch((err) => active && setError(parseApiError(err, "Failed to load absence details.").message))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [from, to]);

  const flagged = data?.days.filter((d) => d.status === "absent" || d.status === "leave") ?? [];

  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-6" aria-labelledby="my-absence-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="my-absence-title" className="text-lg font-semibold text-ink">
          Absence & leave days — {format(month, "MMMM yyyy")}
        </h2>
        <ExportMenu
          compact
          label="my absence"
          onExport={(fmt) => downloadServerExport("/attendance/absence/export", { from_date: from, to_date: to }, fmt, "my-absence")}
        />
      </div>

      {error && <InlineBanner type="error" message={error} />}

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-black/5" aria-hidden="true" />
      ) : (
        data && (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {SUMMARY_ORDER.map((s) => (
                <div key={s} className="rounded-xl border border-border p-3">
                  <dt className="text-xs text-muted">{ABSENCE_LABELS[s]}</dt>
                  <dd className="text-2xl font-semibold text-ink">{data.summary[s]}</dd>
                </div>
              ))}
            </dl>

            {flagged.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted">
                No absent or leave days in this month.
              </p>
            ) : (
              <ul className="grid gap-2">
                {flagged.map((d) => (
                  <li key={d.date} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                    <span className="text-sm font-medium text-ink">{formatDate(d.date)}</span>
                    <span className="flex items-center gap-2">
                      {d.pending_leave && <span className="text-xs text-muted">Leave request pending</span>}
                      <StatusPill status={ABSENCE_LABELS[d.status]} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      )}
    </section>
  );
}
