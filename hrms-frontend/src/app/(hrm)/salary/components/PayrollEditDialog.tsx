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
import { parseApiError } from "@/src/lib/api/errors";
import { formatAmount, monthLabel, payrollService, type PayrollRecord } from "@/src/lib/payroll/payroll.service";

interface Props {
  payroll: PayrollRecord | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// Edit a DRAFT only (the backend refuses processed payroll). Either adjust the
// three stored figures manually (net is derived) or recalculate from the
// employee's current compensation.
export function PayrollEditDialog({ payroll, onOpenChange, onSaved }: Props) {
  const [basic, setBasic] = React.useState("");
  const [gross, setGross] = React.useState("");
  const [deductions, setDeductions] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [busy, setBusy] = React.useState<"save" | "recalc" | null>(null);

  React.useEffect(() => {
    if (payroll) {
      setBasic(String(Number(payroll.basic_salary))); // eslint-disable-line react-hooks/set-state-in-effect
      setGross(String(Number(payroll.gross_salary)));
      setDeductions(String(Number(payroll.total_deductions)));
      setErrors({});
      setFormError("");
    }
  }, [payroll]);

  const net = Number(gross || 0) - Number(deductions || 0);

  const validate = () => {
    const next: Record<string, string> = {};
    const num = (v: string) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;
    if (!num(basic)) next.basic_salary = "Enter a valid amount.";
    if (!num(gross)) next.gross_salary = "Enter a valid amount.";
    if (!num(deductions)) next.total_deductions = "Enter a valid amount.";
    if (!next.basic_salary && !next.gross_salary && Number(basic) > Number(gross)) next.basic_salary = "Basic salary cannot exceed gross salary.";
    if (!next.total_deductions && !next.gross_salary && Number(deductions) > Number(gross)) next.total_deductions = "Deductions cannot exceed gross salary.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (recalculate: boolean) => {
    if (!payroll || busy) return;
    if (!recalculate && !validate()) return;
    setBusy(recalculate ? "recalc" : "save");
    setFormError("");
    try {
      await payrollService.update(
        payroll.id,
        recalculate
          ? { recalculate: true }
          : { basic_salary: Number(basic), gross_salary: Number(gross), total_deductions: Number(deductions) },
      );
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Could not update the payroll draft.");
      setErrors((e) => ({ ...e, ...fieldErrors }));
      const onField = ["basic_salary", "gross_salary", "total_deductions"].some((k) => fieldErrors[k]);
      setFormError(onField ? "" : message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={!!payroll} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
          <DialogTitle className="text-xl">Edit payroll draft</DialogTitle>
        </DialogHeader>

        {payroll && (
          <div className="grid gap-4 px-6 py-6">
            <p className="text-sm text-ink-soft">
              {payroll.employee ? `${payroll.employee.first_name} ${payroll.employee.last_name}` : `Employee #${payroll.employee_id}`}
              {" · "}
              {monthLabel(payroll.payroll_month, payroll.payroll_year)}
            </p>
            {formError && <InlineBanner type="error" message={formError} />}
            <Input label="Basic salary" type="number" inputMode="decimal" min={0} step="0.01" value={basic} onChange={(e) => setBasic(e.target.value)} error={errors.basic_salary} />
            <Input label="Gross salary" type="number" inputMode="decimal" min={0} step="0.01" value={gross} onChange={(e) => setGross(e.target.value)} error={errors.gross_salary} />
            <Input label="Total deductions" type="number" inputMode="decimal" min={0} step="0.01" value={deductions} onChange={(e) => setDeductions(e.target.value)} error={errors.total_deductions} />
            <p className="flex justify-between text-sm font-semibold text-ink" aria-live="polite">
              <span>Net salary</span>
              <span>{formatAmount(Number.isFinite(net) ? net : null)}</span>
            </p>
          </div>
        )}

        <DialogFooter className="flex-wrap border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => submit(true)} isLoading={busy === "recalc"} disabled={busy === "save"}>
            Recalculate from compensation
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={!!busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => submit(false)} isLoading={busy === "save"} disabled={busy === "recalc"}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
