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
import { Textarea } from "@/src/components/ui/Textarea";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDate, formatDateTime } from "@/src/lib/date/format";
import type { RegularizationRecord } from "@/src/lib/attendance/attendance.types";
import { regularizationService } from "@/src/lib/attendance/regularization.service";

type Action = { kind: "approve" | "reject"; record: RegularizationRecord };

// HR/manager review queue. The backend requires `edit attendance` to approve
// or reject and requires remarks only when rejecting.
export function RegularizationReview({ canReview }: { canReview: boolean }) {
  const [rows, setRows] = React.useState<RegularizationRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [action, setAction] = React.useState<Action | null>(null);
  const [remarks, setRemarks] = React.useState("");
  const [fieldError, setFieldError] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await regularizationService.adminList({ status: "Pending", per_page: 50 });
      setRows(result.data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load pending regularizations.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const open = (kind: Action["kind"], record: RegularizationRecord) => {
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
        await regularizationService.approve(action.record.id, remarks.trim() || undefined);
      } else {
        await regularizationService.reject(action.record.id, remarks.trim());
      }
      setNotice(`Request ${action.kind === "approve" ? "approved" : "rejected"}.`);
      setAction(null);
      await load();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Could not update this request.");
      setFieldError(fieldErrors.reviewer_remarks ?? "");
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-6" aria-labelledby="reg-review-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="reg-review-title" className="text-lg font-semibold text-ink">
          Pending regularization requests
        </h2>
        <span className="text-xs text-muted">{isLoading ? "" : `${rows.length} pending`}</span>
      </div>

      {notice && <InlineBanner type="success" message={notice} />}
      {loadError && <InlineBanner type="error" message={loadError} />}

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-black/5" aria-hidden="true" />
      ) : rows.length === 0 && !loadError ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted">
          No pending requests.
        </p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-ink">
                  {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : `Employee #${r.employee_id}`}
                  {r.employee?.employee_code ? <span className="ml-2 text-xs font-normal text-muted">{r.employee.employee_code}</span> : null}
                </p>
                <p className="text-ink-soft">
                  {formatDate(r.attendance_date)} · in {formatDateTime(r.requested_check_in)} · out {formatDateTime(r.requested_check_out)}
                </p>
                <p className="truncate text-ink-soft" title={r.reason}>{r.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={r.status} />
                {canReview && (
                  <>
                    <Button type="button" size="sm" onClick={() => open("approve", r)} aria-label={`Approve request from ${r.employee?.first_name ?? "employee"}`}>
                      <Check className="size-4" /> Approve
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => open("reject", r)} aria-label={`Reject request from ${r.employee?.first_name ?? "employee"}`}>
                      <X className="size-4" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!action} onOpenChange={(o) => !o && !isSaving && setAction(null)}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          <DialogHeader className="bg-primary px-6 py-4 text-primary-foreground">
            <DialogTitle className="text-xl">
              {action?.kind === "approve" ? "Approve request" : "Reject request"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 px-6 py-6">
            {formError && <InlineBanner type="error" message={formError} />}
            <Textarea
              label={action?.kind === "reject" ? "Remarks (required)" : "Remarks (optional)"}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              error={fieldError}
              rows={3}
            />
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
