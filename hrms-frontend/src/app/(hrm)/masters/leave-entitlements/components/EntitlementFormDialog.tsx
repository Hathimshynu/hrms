"use client";

import * as React from "react";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { parseApiError } from "@/src/lib/api/errors";
import {
  leaveEntitlementService,
  type LeaveEntitlementOptions,
  type LeaveEntitlementRow,
} from "@/src/lib/leave-entitlements/leave-entitlement.service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create, otherwise edit (only the number of days can change). */
  record: LeaveEntitlementRow | null;
  options: LeaveEntitlementOptions | null;
  defaultYear: number;
  yearOptions: number[];
  onSaved: (message: string) => void;
}

const FIELDS = ["employee_id", "leave_policy_id", "leave_year", "entitled_days"];

// Mirrors the backend rules: 0-366 days, at most 2 decimal places.
function validateDays(raw: string): string {
  if (raw.trim() === "") return "Entitled days is required.";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "Entitled days must be a number.";
  if (n < 0) return "Entitled days cannot be negative.";
  if (n > 366) return "Entitled days cannot exceed 366.";
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return "Entitled days can have at most 2 decimal places.";
  return "";
}

export function EntitlementFormDialog({ open, onOpenChange, record, options, defaultYear, yearOptions, onSaved }: Props) {
  const isEdit = record !== null;
  const [employeeId, setEmployeeId] = React.useState("");
  const [policyId, setPolicyId] = React.useState("");
  const [year, setYear] = React.useState(String(defaultYear));
  const [days, setDays] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setEmployeeId(record ? String(record.employee_id) : "");
    setPolicyId(record ? String(record.leave_policy_id) : "");
    setYear(String(record?.leave_year ?? defaultYear));
    setDays(record ? String(record.entitled_days) : "");
    setErrors({});
    setFormError("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, record, defaultYear]);

  const clear = (key: string) => setErrors((e) => ({ ...e, [key]: "" }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isEdit) {
      if (!employeeId) next.employee_id = "Select an employee.";
      if (!policyId) next.leave_policy_id = "Select a leave type.";
      if (!year) next.leave_year = "Select a leave year.";
    }
    const dayError = validateDays(days);
    if (dayError) next.entitled_days = dayError;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;
    setIsSaving(true);
    setFormError("");
    try {
      const value = Number(days);
      const res = record
        ? await leaveEntitlementService.update(record.id, value)
        : await leaveEntitlementService.create({
            employee_id: Number(employeeId),
            leave_policy_id: Number(policyId),
            leave_year: Number(year),
            entitled_days: value,
          });
      onOpenChange(false);
      onSaved(res.message ?? "Leave entitlement saved.");
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Could not save the leave entitlement.");
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setFormError(FIELDS.some((k) => fieldErrors[k]) ? "" : message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={submit} noValidate>
          <DialogHeader className="bg-primary px-6 py-4 text-primary-foreground">
            <DialogTitle className="text-xl">{isEdit ? "Edit leave entitlement" : "Add leave entitlement"}</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              {isEdit
                ? "Only the number of days can be changed."
                : "Allocate leave days to one employee for one leave type and year."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-6">
            {formError && <InlineBanner type="error" message={formError} />}

            {isEdit && record ? (
              <dl className="grid gap-2 rounded-xl border border-border bg-surface-muted p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted">Employee</dt>
                  <dd className="font-medium text-ink">
                    {record.employee_name} {record.employee_code ? `(${record.employee_code})` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Leave type · Year</dt>
                  <dd className="font-medium text-ink">
                    {record.leave_type_name ?? record.leave_type} · {record.leave_year}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Approved days</dt>
                  <dd className="font-medium text-ink">{record.approved_days}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Pending days</dt>
                  <dd className="font-medium text-ink">{record.pending_days}</dd>
                </div>
              </dl>
            ) : (
              <>
                <Select
                  label="Employee"
                  placeholder="Select employee"
                  options={(options?.employees ?? []).map((e) => ({
                    label: `${e.name}${e.employee_code ? ` (${e.employee_code})` : ""}`,
                    value: String(e.id),
                  }))}
                  value={employeeId}
                  onChange={(v) => {
                    setEmployeeId((v as string) || "");
                    clear("employee_id");
                  }}
                  error={errors.employee_id}
                />
                <Select
                  label="Leave type"
                  placeholder="Select leave type"
                  options={(options?.leave_policies ?? []).map((p) => ({ label: p.name, value: String(p.id) }))}
                  value={policyId}
                  onChange={(v) => {
                    setPolicyId((v as string) || "");
                    clear("leave_policy_id");
                  }}
                  error={errors.leave_policy_id}
                />
                <Select
                  label="Leave year"
                  placeholder="Select year"
                  clearable={false}
                  options={yearOptions.map((y) => ({ label: String(y), value: String(y) }))}
                  value={year}
                  onChange={(v) => {
                    setYear((v as string) || "");
                    clear("leave_year");
                  }}
                  error={errors.leave_year}
                />
              </>
            )}

            <Input
              label="Entitled days"
              type="number"
              inputMode="decimal"
              min={0}
              max={366}
              step="any"
              placeholder="e.g. 12"
              value={days}
              onChange={(e) => {
                setDays(e.target.value);
                clear("entitled_days");
              }}
              error={errors.entitled_days}
            />

            <p className="text-xs text-muted">
              Remaining = entitled − approved days. Pending requests do not use up the entitlement until they are approved.
              {isEdit ? " It cannot be set below the days already approved." : ""}
            </p>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {isEdit ? "Save changes" : "Add entitlement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
