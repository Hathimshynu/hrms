"use client";

import { Check, X } from "lucide-react";
import * as React from "react";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import { StatusPill } from "@/src/components/ui/Datatable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDate, formatDateTime } from "@/src/lib/date/format";
import { leaveService } from "@/src/lib/leave/leave.service";
import type { LeaveRecord, LeaveStatus, LeaveTypeOption } from "@/src/lib/leave/leave.types";
import { LEAVE_STATUS_LABEL, STATUS_FILTER_OPTIONS } from "./MyLeaves";

type Action = { kind: "approve" | "reject"; record: LeaveRecord };

interface Props {
  types: LeaveTypeOption[];
  canApprove: boolean;
  canReject: boolean;
  onReviewed: () => void;
}

// Reviewer queue. The backend requires `approve leaves` / `reject leaves`,
// requires remarks on rejection, and refuses to let anyone decide their own
// request or a request that is no longer pending.
export function LeaveReview({ types, canApprove, canReject, onReviewed }: Props) {
  const [rows, setRows] = React.useState<LeaveRecord[]>([]);
  const [status, setStatus] = React.useState<string>("pending");
  const [leaveType, setLeaveType] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [action, setAction] = React.useState<Action | null>(null);
  const [remarks, setRemarks] = React.useState("");
  const [fieldError, setFieldError] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const typeName = React.useMemo(() => new Map(types.map((t) => [t.code, t.name])), [types]);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await leaveService.adminList({
        status: (status as LeaveStatus) || undefined,
        leave_type: leaveType || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        per_page: 10,
      });
      setRows(result.data);
      setLastPage(result.last_page);
      setTotal(result.total);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load leave requests.").message);
    } finally {
      setIsLoading(false);
    }
  }, [status, leaveType, fromDate, toDate, page]);

  React.useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const open = (kind: Action["kind"], record: LeaveRecord) => {
    setAction({ kind, record });
    setRemarks("");
    setFieldError("");
    setFormError("");
  };

  const submit = async () => {
    if (!action || isSaving) return;
    if (action.kind === "reject" && !remarks.trim()) {
      setFieldError("Remarks are required to reject a request.");
      return;
    }
    setIsSaving(true);
    setFormError("");
    try {
      if (action.kind === "approve") {
        await leaveService.approve(action.record.id);
      } else {
        await leaveService.reject(action.record.id, remarks.trim());
      }
      setNotice(`Leave request ${action.kind === "approve" ? "approved" : "rejected"}.`);
      setAction(null);
      onReviewed();
      await load();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Could not update this request.");
      setFieldError(fieldErrors.rejection_reason ?? "");
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const employeeName = (r: LeaveRecord) =>
    r.employee ? `${r.employee.first_name} ${r.employee.last_name}`.trim() : `Employee #${r.employee_id}`;

  const days = (r: LeaveRecord) => `${Number(r.total_days)} ${Number(r.total_days) === 1 ? "day" : "days"}`;

  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-6" aria-labelledby="leave-review-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="leave-review-title" className="text-lg font-semibold text-ink">
          Leave review
        </h2>
        <span className="text-xs text-muted">{isLoading ? "" : `${total} request${total === 1 ? "" : "s"}`}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <Select
          aria-label="Filter by leave type"
          placeholder="All leave types"
          options={types.map((t) => ({ label: t.name, value: t.code }))}
          value={leaveType}
          clearable
          onChange={(v) => {
            setLeaveType((v as string) || "");
            setPage(1);
          }}
        />
        <Input
          type="date"
          aria-label="Leave from date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          aria-label="Leave to date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {notice && <InlineBanner type="success" message={notice} />}
      {loadError && <InlineBanner type="error" message={loadError} />}

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-black/5" aria-hidden="true" />
      ) : rows.length === 0 && !loadError ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted">
          No leave requests match these filters.
        </p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-ink">
                  {employeeName(r)}
                  {r.employee?.employee_code ? (
                    <span className="ml-2 text-xs font-normal text-muted">{r.employee.employee_code}</span>
                  ) : null}
                  {r.employee?.department?.name ? (
                    <span className="ml-2 text-xs font-normal text-muted">· {r.employee.department.name}</span>
                  ) : null}
                </p>
                <p className="text-ink-soft">
                  {typeName.get(r.leave_type) ?? r.leave_type} · {formatDate(r.start_date)} – {formatDate(r.end_date)} · {days(r)}
                </p>
                {r.reason && (
                  <p className="truncate text-ink-soft" title={r.reason}>
                    {r.reason}
                  </p>
                )}
                {r.status === "rejected" && r.rejection_reason && (
                  <p className="text-red-700">Remarks: {r.rejection_reason}</p>
                )}
                {r.approved_at && (
                  <p className="text-xs text-muted">
                    Reviewed{r.approver ? ` by ${r.approver.name}` : ""} on {formatDateTime(r.approved_at)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={LEAVE_STATUS_LABEL[r.status]} />
                {r.status === "pending" && canApprove && (
                  <Button type="button" size="sm" onClick={() => open("approve", r)} aria-label={`Approve leave request from ${employeeName(r)}`}>
                    <Check className="size-4" /> Approve
                  </Button>
                )}
                {r.status === "pending" && canReject && (
                  <Button type="button" size="sm" variant="outline" onClick={() => open("reject", r)} aria-label={`Reject leave request from ${employeeName(r)}`}>
                    <X className="size-4" /> Reject
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

      <Dialog open={!!action} onOpenChange={(o) => !o && !isSaving && setAction(null)}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          <DialogHeader className="bg-primary px-6 py-4 text-primary-foreground">
            <DialogTitle className="text-xl">
              {action?.kind === "approve" ? "Approve leave request" : "Reject leave request"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 px-6 py-6">
            {formError && <InlineBanner type="error" message={formError} />}
            {action && (
              <p className="text-sm text-ink-soft">
                {employeeName(action.record)} · {formatDate(action.record.start_date)} – {formatDate(action.record.end_date)} · {days(action.record)}
              </p>
            )}
            {action?.kind === "reject" && (
              <Textarea
                label="Remarks (required)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                error={fieldError}
                rows={3}
                maxLength={500}
              />
            )}
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setAction(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" isLoading={isSaving} onClick={submit}>
              {action?.kind === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
