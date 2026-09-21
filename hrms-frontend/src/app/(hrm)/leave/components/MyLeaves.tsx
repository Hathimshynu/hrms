"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { ExportMenu } from "@/src/components/common/ExportMenu";
import { downloadServerExport } from "@/src/lib/export/download";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import { StatusPill } from "@/src/components/ui/Datatable";
import { Select } from "@/src/components/ui/Select";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDate, formatDateTime } from "@/src/lib/date/format";
import { leaveService } from "@/src/lib/leave/leave.service";
import type { LeaveRecord, LeaveStatus, LeaveTypeOption } from "@/src/lib/leave/leave.types";

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const STATUS_FILTER_OPTIONS = (Object.keys(LEAVE_STATUS_LABEL) as LeaveStatus[]).map((s) => ({
  label: LEAVE_STATUS_LABEL[s],
  value: s,
}));

interface Props {
  types: LeaveTypeOption[];
  refreshKey: number;
  canApply: boolean;
  canCancel: boolean;
  onApply: () => void;
  onChanged: () => void;
}

export function MyLeaves({ types, refreshKey, canApply, canCancel, onApply, onChanged }: Props) {
  const [rows, setRows] = React.useState<LeaveRecord[]>([]);
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [cancellingId, setCancellingId] = React.useState<number | null>(null);

  const typeName = React.useMemo(() => new Map(types.map((t) => [t.code, t.name])), [types]);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await leaveService.list({ status: (status as LeaveStatus) || undefined, page, per_page: 10 });
      setRows(result.data);
      setLastPage(result.last_page);
    } catch (err) {
      setError(parseApiError(err, "Failed to load your leave requests.").message);
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  React.useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load, refreshKey]);

  const cancel = async (id: number) => {
    setCancellingId(id);
    setError(null);
    setNotice(null);
    try {
      await leaveService.cancel(id);
      setNotice("Leave request cancelled.");
      onChanged();
      await load();
    } catch (err) {
      setError(parseApiError(err, "Could not cancel this request.").message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-6" aria-labelledby="my-leaves-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="my-leaves-title" className="text-lg font-semibold text-ink">
          My leave requests
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Select
              aria-label="Filter by status"
              placeholder="All statuses"
              options={STATUS_FILTER_OPTIONS}
              value={status}
              clearable
              onChange={(v) => {
                setStatus((v as string) || "");
                setPage(1);
              }}
            />
          </div>
          <ExportMenu
            compact
            label="my leave requests"
            onExport={(format) => downloadServerExport("/leaves/export", { status }, format, "my-leave")}
          />
          {canApply && (
            <Button type="button" onClick={onApply}>
              <Plus className="size-4" /> Apply leave
            </Button>
          )}
        </div>
      </div>

      {notice && <InlineBanner type="success" message={notice} />}
      {error && <InlineBanner type="error" message={error} />}

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-black/5" aria-hidden="true" />
      ) : rows.length === 0 && !error ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted">
          No leave requests found.
        </p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-ink">
                  {typeName.get(r.leave_type) ?? r.leave_type}
                  <span className="ml-2 text-xs font-normal text-muted">
                    {Number(r.total_days)} {Number(r.total_days) === 1 ? "day" : "days"}
                  </span>
                </p>
                <p className="text-ink-soft">
                  {formatDate(r.start_date)} – {formatDate(r.end_date)}
                </p>
                {r.reason && (
                  <p className="truncate text-ink-soft" title={r.reason}>
                    {r.reason}
                  </p>
                )}
                {r.status === "rejected" && r.rejection_reason && (
                  <p className="text-red-700">Reviewer remarks: {r.rejection_reason}</p>
                )}
                {(r.status === "approved" || r.status === "rejected") && r.approved_at && (
                  <p className="text-xs text-muted">
                    {r.status === "approved" ? "Approved" : "Rejected"}
                    {r.approver ? ` by ${r.approver.name}` : ""} on {formatDateTime(r.approved_at)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={LEAVE_STATUS_LABEL[r.status]} />
                {canCancel && r.status === "pending" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    isLoading={cancellingId === r.id}
                    onClick={() => cancel(r.id)}
                    aria-label={`Cancel leave request from ${formatDate(r.start_date)}`}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button type="button" size="sm" variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-muted">
            Page {page} of {lastPage}
          </span>
          <Button type="button" size="sm" variant="outline" disabled={page >= lastPage || isLoading} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
