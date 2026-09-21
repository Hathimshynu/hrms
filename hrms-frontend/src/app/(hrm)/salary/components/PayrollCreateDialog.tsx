"use client";

import * as React from "react";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { parseApiError } from "@/src/lib/api/errors";
import { getMonthKeyIST } from "@/src/lib/date/format";
import { employeeService, type EmployeeListItem } from "@/src/lib/employees/employee.service";
import {
  MONTH_OPTIONS,
  formatAmount,
  monthLabel,
  payrollService,
  type PayrollPreview,
} from "@/src/lib/payroll/payroll.service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const LABELS: Record<string, string> = {
  basic_salary: "Basic salary",
  hra: "HRA",
  special_allowance: "Special allowance",
  other_allowances: "Other allowances",
  employee_pf: "Employee PF",
  employee_esi: "Employee ESI",
  professional_tax: "Professional tax",
};

// Pick employee + month, PREVIEW the server-side calculation, then create a
// draft. Amounts are never typed here: the backend always calculates them from
// the employee's compensation.
export function PayrollCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const [employees, setEmployees] = React.useState<EmployeeListItem[]>([]);
  const [employeeId, setEmployeeId] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [year, setYear] = React.useState("");
  const [preview, setPreview] = React.useState<PayrollPreview | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const [y, m] = getMonthKeyIST().split("-");
    setEmployeeId(""); // eslint-disable-line react-hooks/set-state-in-effect
    setMonth(String(Number(m)));
    setYear(y);
    setPreview(null);
    setErrors({});
    setFormError("");
    employeeService
      .list({ status: "Active", limit: 100 })
      .then((r) => setEmployees(r.data))
      .catch(() => setEmployees([]));
  }, [open]);

  const key = () => ({
    employee_id: Number(employeeId),
    payroll_month: Number(month),
    payroll_year: Number(year),
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!employeeId) next.employee_id = "Select an employee.";
    if (!month) next.payroll_month = "Select a month.";
    if (!/^\d{4}$/.test(year) || Number(year) < 2000 || Number(year) > 2100) next.payroll_year = "Enter a valid year.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const invalidate = () => {
    setPreview(null);
    setFormError("");
  };

  const runPreview = async () => {
    if (isPreviewing || !validate()) return;
    setIsPreviewing(true);
    setFormError("");
    try {
      setPreview(await payrollService.preview(key()));
    } catch (err) {
      setPreview(null);
      const { message, fieldErrors } = parseApiError(err, "Could not calculate payroll.");
      setErrors((e) => ({ ...e, ...fieldErrors }));
      setFormError(fieldErrors.employee_id || fieldErrors.payroll_month ? "" : message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const create = async () => {
    if (isSaving || !preview) return;
    setIsSaving(true);
    setFormError("");
    try {
      await payrollService.create(key());
      onOpenChange(false);
      onCreated();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Could not create the payroll draft.");
      setErrors((e) => ({ ...e, ...fieldErrors }));
      setFormError(fieldErrors.employee_id ? "" : message);
    } finally {
      setIsSaving(false);
    }
  };

  const rows = (values: Record<string, number>) =>
    Object.entries(values).map(([k, v]) => (
      <div key={k} className="flex justify-between text-sm">
        <dt className="text-ink-soft">{LABELS[k] ?? k}</dt>
        <dd className="font-medium text-ink">{formatAmount(v)}</dd>
      </div>
    ));

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
          <DialogTitle className="text-xl">New payroll draft</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-4 overflow-y-auto px-6 py-6">
          {formError && <InlineBanner type="error" message={formError} />}

          <Select
            label="Employee"
            placeholder="Select employee"
            options={employees.map((e) => ({ label: `${e.name} (${e.employee_code})`, value: String(e.id) }))}
            value={employeeId}
            onChange={(v) => {
              setEmployeeId((v as string) || "");
              invalidate();
            }}
            error={errors.employee_id}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Month"
              placeholder="Select month"
              options={MONTH_OPTIONS}
              value={month}
              onChange={(v) => {
                setMonth((v as string) || "");
                invalidate();
              }}
              error={errors.payroll_month}
            />
            <Input
              label="Year"
              type="number"
              inputMode="numeric"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                invalidate();
              }}
              error={errors.payroll_year}
            />
          </div>

          <div>
            <Button type="button" variant="outline" isLoading={isPreviewing} onClick={runPreview}>
              Calculate preview
            </Button>
          </div>

          {preview && (
            <div className="grid gap-3 rounded-xl border border-border p-4" aria-live="polite">
              <p className="text-sm font-semibold text-ink">
                {preview.employee.name} · {monthLabel(preview.payroll_month, preview.payroll_year)}
              </p>
              {preview.existing && (
                <InlineBanner type="error" message="A payroll record already exists for this employee and month." />
              )}
              <dl className="grid gap-1">
                <dt className="text-xs font-semibold uppercase text-muted">Earnings</dt>
                {rows(preview.breakdown.earnings)}
                <div className="flex justify-between border-t border-border pt-1 text-sm font-semibold">
                  <dt>Gross salary</dt>
                  <dd>{formatAmount(preview.gross_salary)}</dd>
                </div>
                <dt className="mt-2 text-xs font-semibold uppercase text-muted">Deductions</dt>
                {rows(preview.breakdown.deductions)}
                <div className="flex justify-between border-t border-border pt-1 text-sm font-semibold">
                  <dt>Total deductions</dt>
                  <dd>{formatAmount(preview.total_deductions)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
                  <dt>Net salary</dt>
                  <dd>{formatAmount(preview.net_salary)}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted">
                Calculated from the employee&apos;s {preview.source.salary_type} compensation effective{" "}
                {preview.source.effective_from ?? "—"}. {preview.source.notes.join(" ")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" isLoading={isSaving} disabled={!preview || !!preview.existing} onClick={create}>
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
