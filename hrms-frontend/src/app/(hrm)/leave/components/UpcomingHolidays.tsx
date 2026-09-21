"use client";

import * as React from "react";

import { formatDate } from "@/src/lib/date/format";
import { holidayService, type UpcomingHoliday } from "@/src/lib/holidays/holiday.service";

function until(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

// Read-only list of the next active holidays from GET /api/leaves/holidays
// (open to everyone who can view leave). Hidden entirely on failure: a
// missing holiday list must not break the leave page.
export function UpcomingHolidays() {
  const [items, setItems] = React.useState<UpcomingHoliday[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();
    holidayService
      .upcoming(controller.signal)
      .then(setItems)
      .catch(() => !controller.signal.aborted && setFailed(true));
    return () => controller.abort();
  }, []);

  if (failed) return null;

  return (
    <section className="grid gap-3" aria-labelledby="upcoming-holidays-title">
      <h2 id="upcoming-holidays-title" className="text-lg font-semibold text-ink">
        Upcoming holidays
      </h2>
      {items === null ? (
        <div className="h-20 animate-pulse rounded-2xl bg-black/5" aria-hidden="true" />
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface py-6 text-center text-sm text-muted">
          No upcoming holidays have been added yet.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{h.name}</p>
                <p className="text-xs text-muted">{formatDate(h.holiday_date)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700">{until(h.days_until)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
