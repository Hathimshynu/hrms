"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { Button } from "@/src/components/ui/Button";
import type { Series } from "./ReportCharts";

// Recharts is only needed once a report is on screen; keep it out of the
// initial bundle.
const ReportBarChart = dynamic(() => import("./ReportCharts").then((m) => m.ReportBarChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-black/5" aria-hidden="true" />,
});

export const SERIES = {
  present: { key: "present", label: "Present", color: "#10b981" },
  absent: { key: "absent", label: "Absent", color: "#ef4444" },
  leave: { key: "leave", label: "Approved leave", color: "#3b82f6" },
  weekly_off: { key: "weekly_off", label: "Weekly off", color: "#94a3b8" },
  holiday: { key: "holiday", label: "Holiday", color: "#ec4899" },
  upcoming: { key: "upcoming", label: "Upcoming", color: "#cbd5e1" },
} satisfies Record<string, Series>;

export function Skeleton({ className = "h-40" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} aria-hidden="true" />;
}

export function Empty({ message }: { message: string }) {
  return (
    <p role="status" className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
      {message}
    </p>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-ink">{value}</dd>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Section({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <section aria-labelledby={id} className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={id} className="text-lg font-semibold text-ink">
            {title}
          </h2>
          {description && <p className="text-sm text-ink-soft">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
  sortKey?: string;
}

/** Plain semantic table with controlled horizontal scroll and optional server sorting. */
export function DataGrid<T>({
  caption,
  columns,
  rows,
  rowKey,
  sortBy,
  sortDir,
  onSort,
  emptyMessage = "No data for these filters.",
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) return <Empty message={emptyMessage} />;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-black/[0.03] text-xs text-muted">
          <tr>
            {columns.map((c) => {
              const active = c.sortKey && c.sortKey === sortBy;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sortDir === "desc" ? "descending" : "ascending") : undefined}
                  className={`px-3 py-2 font-medium ${c.align === "right" ? "text-right" : ""}`}
                >
                  {c.sortKey && onSort ? (
                    <button type="button" onClick={() => onSort(c.sortKey as string)} className="inline-flex cursor-pointer items-center gap-1 hover:text-ink focus-visible:outline focus-visible:outline-2">
                      {c.header}
                      <span aria-hidden="true">{active ? (sortDir === "desc" ? "▼" : "▲") : ""}</span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-border/60">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 text-ink ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page, lastPage, onPage, busy }: { page: number; lastPage: number; onPage: (p: number) => void; busy?: boolean }) {
  if (lastPage <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <Button type="button" size="sm" variant="outline" disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="text-muted">
        Page {page} of {lastPage}
      </span>
      <Button type="button" size="sm" variant="outline" disabled={page >= lastPage || busy} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  );
}

/** A chart plus the same numbers as a table, so nothing is chart-only. */
export function ChartBlock({
  title,
  summary,
  data,
  xKey,
  xHeader,
  series,
  stacked,
  horizontal,
  formatX,
  formatValue,
  height,
  emptyMessage,
}: {
  title: string;
  summary: string;
  data: Record<string, string | number>[];
  xKey: string;
  xHeader: string;
  series: Series[];
  stacked?: boolean;
  horizontal?: boolean;
  formatX?: (v: string) => string;
  formatValue?: (v: number) => string;
  height?: number;
  emptyMessage: string;
}) {
  const hasData = data.length > 0 && data.some((row) => series.some((s) => Number(row[s.key]) > 0));

  return (
    <figure className="grid gap-3" aria-label={title}>
      <figcaption className="text-sm font-semibold text-ink">{title}</figcaption>
      {hasData ? (
        <>
          <div role="img" aria-label={`${title}. ${summary}`}>
            <ReportBarChart data={data} xKey={xKey} series={series} stacked={stacked} horizontal={horizontal} formatX={formatX} formatValue={formatValue} height={height} />
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-ink-soft focus-visible:outline focus-visible:outline-2">View data as table</summary>
            <div className="mt-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[320px] text-left text-xs">
                <caption className="sr-only">{title}</caption>
                <thead className="bg-black/[0.03] text-muted">
                  <tr>
                    <th scope="col" className="px-2 py-1.5">{xHeader}</th>
                    {series.map((s) => (
                      <th key={s.key} scope="col" className="px-2 py-1.5 text-right">{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={String(row[xKey])} className="border-t border-border/60">
                      <th scope="row" className="px-2 py-1.5 font-medium">{formatX ? formatX(String(row[xKey])) : String(row[xKey])}</th>
                      {series.map((s) => (
                        <td key={s.key} className="px-2 py-1.5 text-right tabular-nums">{formatValue ? formatValue(Number(row[s.key])) : String(row[s.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <Empty message={emptyMessage} />
      )}
    </figure>
  );
}
