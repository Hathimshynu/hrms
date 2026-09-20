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
import { Textarea } from "@/src/components/ui/Textarea";
import { parseApiError } from "@/src/lib/api/errors";
import { leaveService } from "@/src/lib/leave/leave.service";
import type { LeaveTypeOption } from "@/src/lib/leave/leave.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: LeaveTypeOption[];
  onApplied: () => void;
}

const EMPTY = { leave_type: "", start_date: "", end_date: "", reason: "" };

export function ApplyLeaveDialog({ open, onOpenChange, types, onApplied }: Props) {
  const [form, setForm] = React.useState(EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY); // eslint-disable-line react-hooks/set-state-in-effect
      setErrors({});
      setFormError("");
    }
  }, [open]);

  const set = (key: keyof typeof EMPTY, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.leave_type) next.leave_type = "Select a leave type.";
    if (!form.start_date) next.start_date = "From date is required.";
    if (!form.end_date) next.end_date = "To date is required.";
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      next.end_date = "To date cannot be before the from date.";
    }
    if (!form.reason.trim()) next.reason = "Please provide a reason for the leave.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;
    setIsSaving(true);
    setFormError("");
    try {
      await leaveService.apply({ ...form, reason: form.reason.trim() });
      onOpenChange(false);
      onApplied();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Could not submit the leave request.");
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      const onField = ["leave_type", "start_date", "end_date", "reason"].some((k) => fieldErrors[k]);
      setFormError(onField ? "" : message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={submit} noValidate>
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className="text-xl">Apply for leave</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-6">
            {formError && <InlineBanner type="error" message={formError} />}

            <Select
              label="Leave type"
              placeholder="Select leave type"
              options={types.map((t) => ({ label: t.name, value: t.code }))}
              value={form.leave_type}
              onChange={(v) => set("leave_type", (v as string) || "")}
              error={errors.leave_type}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="From date"
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                error={errors.start_date}
              />
              <Input
                label="To date"
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => set("end_date", e.target.value)}
                error={errors.end_date}
              />
            </div>

            <Textarea
              label="Reason"
              placeholder="Reason for leave"
              rows={3}
              maxLength={500}
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              error={errors.reason}
            />

            <p className="text-xs text-muted">
              The number of days is calculated when you submit; your weekly offs are not counted.
            </p>
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
