"use client";

import * as React from "react";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/Input";
import { Switch } from "@/src/components/ui/Switch";
import { Textarea } from "@/src/components/ui/Textarea";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDate } from "@/src/lib/date/format";
import { holidayService, type Holiday } from "@/src/lib/holidays/holiday.service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create. */
  record: Holiday | null;
  defaultDate: string;
  onSaved: (message: string) => void;
}

const FIELDS = ["name", "holiday_date", "description", "is_active"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Weekday of a Y-m-d string without any time zone conversion. */
export function weekdayOf(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return "";
  return WEEKDAYS[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()];
}

export function HolidayFormDialog({ open, onOpenChange, record, defaultDate, onSaved }: Props) {
  const isEdit = record !== null;
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(record?.name ?? "");
    setDate(record ? record.holiday_date.slice(0, 10) : defaultDate);
    setDescription(record?.description ?? "");
    setActive(record?.is_active ?? true);
    setErrors({});
    setFormError("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, record, defaultDate]);

  const clear = (key: string) => setErrors((e) => ({ ...e, [key]: "" }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Holiday name is required.";
    else if (name.trim().length > 150) next.name = "Holiday name cannot exceed 150 characters.";
    if (!date) next.holiday_date = "Holiday date is required.";
    else if (date < "2000-01-01" || date > "2100-12-31") next.holiday_date = "Holiday date must be between the years 2000 and 2100.";
    if (description.length > 500) next.description = "Description cannot exceed 500 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;
    setIsSaving(true);
    setFormError("");
    const payload = { name: name.trim(), holiday_date: date, description: description.trim() || null, is_active: active };
    try {
      const res = record ? await holidayService.update(record.id, payload) : await holidayService.create(payload);
      onOpenChange(false);
      onSaved(res.message ?? "Holiday saved.");
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Could not save the holiday.");
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
            <DialogTitle className="text-xl">{isEdit ? "Edit holiday" : "Add holiday"}</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              Active holidays are not counted as leave days and show as Holiday in attendance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-6">
            {formError && <InlineBanner type="error" message={formError} />}

            <Input
              label="Holiday name"
              value={name}
              maxLength={150}
              onChange={(e) => {
                setName(e.target.value);
                clear("name");
              }}
              error={errors.name}
            />

            <div>
              <Input
                label="Date"
                type="date"
                min="2000-01-01"
                max="2100-12-31"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  clear("holiday_date");
                }}
                error={errors.holiday_date}
              />
              {date && !errors.holiday_date && (
                <p className="mt-1.5 text-xs text-muted">
                  {formatDate(date)} · {weekdayOf(date)}
                </p>
              )}
            </div>

            <Textarea
              label="Description (optional)"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clear("description");
              }}
              error={errors.description}
            />

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3">
              <div>
                <p id="holiday-active-label" className="text-sm font-semibold text-ink">
                  Active
                </p>
                <p className="text-xs text-muted">{active ? "Counts as a holiday." : "Ignored by leave and attendance."}</p>
              </div>
              <Switch checked={active} onChange={setActive} ariaLabel="Active holiday" />
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {isEdit ? "Save changes" : "Add holiday"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
