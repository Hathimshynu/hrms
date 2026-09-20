// src/app/(hrm)/masters/components/MasterFormDialog.tsx
//
// Shared add/edit dialog for the 8 CRUD "employee master" pages, modeled
// directly on src/app/(hrm)/organization/components/AddDepartment.tsx
// (same header/body/footer layout, same server-error surfacing via
// serverErrors/formError props). The 3 masters with no extra fields
// (Leave/Attendance Policies, Onboarding Checklists) render with
// extraFields=[]; the other 5 pass a small config describing their own
// extra inputs (start_time/end_time/working_hours, days,
// grace_minutes/max_late_minutes, minimum_hours/multiplier) so the form
// genuinely differs per master's real data shape instead of forcing a
// one-size-fits-all layout.
"use client";

import { toTimeInputValue } from "@/src/lib/date/format";
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
import { Switch } from "@/src/components/ui/Switch";
import { Textarea } from "@/src/components/ui/Textarea";
import type { BaseMasterDto, BaseMasterPayload } from "@/src/lib/masters/master.service";
import * as React from "react";

const DEFAULTED_NOT_NULL = new Set(["grace_minutes", "minimum_hours", "multiplier"]);

export type MasterFieldConfig =
  | { type: "time"; key: string; label: string }
  | { type: "number"; key: string; label: string; step?: string; min?: number }
  | { type: "integer"; key: string; label: string; min?: number }
  | { type: "days"; key: string; label: string };

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface FormState {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  [key: string]: unknown;
}

function buildEmptyForm(extraFields: MasterFieldConfig[]): FormState {
  const base: FormState = { name: "", code: "", description: "", is_active: true };
  for (const field of extraFields) {
    base[field.key] = field.type === "days" ? [] : "";
  }
  return base;
}

interface MasterFormDialogProps<
  TDto extends BaseMasterDto,
  TPayload extends BaseMasterPayload,
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: TPayload) => void;
  record?: TDto | null; // pass to edit, omit/null to add
  isSaving?: boolean;
  // Server-side (422) field errors from the last submit attempt.
  serverErrors?: Record<string, string>;
  // Non-field error (e.g. 409/500) from the last submit attempt.
  formError?: string | null;
  nounSingular: string; // e.g. "Leave Policy"
  extraFields?: MasterFieldConfig[];
}

export function MasterFormDialog<
  TDto extends BaseMasterDto,
  TPayload extends BaseMasterPayload,
>({
  open,
  onOpenChange,
  onSave,
  record,
  isSaving = false,
  serverErrors,
  formError,
  nounSingular,
  extraFields = [],
}: MasterFormDialogProps<TDto, TPayload>) {
  const isEditMode = !!record;

  const [formData, setFormData] = React.useState<FormState>(() => buildEmptyForm(extraFields));
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset/populate the form whenever the dialog opens or the target
  // record changes (add vs edit).
  React.useEffect(() => {
    if (!open) return;
    if (record) {
      // record is a real TDto at runtime (with whatever extra keys this
      // master's DTO adds) - the cast lets us read those dynamically
      // configured keys without widening the public TDto type itself.
      const extra = record as unknown as Record<string, unknown>;
      const next: FormState = {
        name: record.name,
        code: record.code,
        description: record.description ?? "",
        is_active: record.is_active ?? true,
      };
      for (const field of extraFields) {
        const value = extra[field.key];
        next[field.key] =
          field.type === "days"
            ? Array.isArray(value) ? value : []
            : field.type === "time"
              ? toTimeInputValue(value)
              : value ?? "";
      }
      setFormData(next);
    } else {
      setFormData(buildEmptyForm(extraFields));
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, open]);

  // Surface 422 errors returned by the last submit attempt.
  React.useEffect(() => {
    if (serverErrors) setErrors((prev) => ({ ...prev, ...serverErrors }));
  }, [serverErrors]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = `${nounSingular} name is required`;
    if (!formData.code.trim()) nextErrors.code = `${nounSingular} code is required`;
    // Extra fields are all backend-nullable (see masterCreate/masterUpdate
    // validation rules) so they are not force-required here - only kept
    // to their input-level format (time/number) via native input types.
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || null,
      is_active: formData.is_active,
    };

    for (const field of extraFields) {
      const raw = formData[field.key];
      if (field.type === "days") {
        payload[field.key] = Array.isArray(raw) ? raw : [];
      } else if (field.type === "number" || field.type === "integer") {
        const empty = raw === "" || raw === undefined || raw === null;
        // These columns are NOT NULL with DB defaults, but the backend
        // validator accepts null (-> 500). Omit when empty so the default applies.
        if (empty && DEFAULTED_NOT_NULL.has(field.key)) continue;
        payload[field.key] = empty ? null : Number(raw);
      } else {
        payload[field.key] = raw === "" ? null : raw;
      }
    }

    // Built dynamically from the extraFields config, which each caller
    // defines to exactly match its own TPayload shape - see the field
    // configs in each masters/<slug>/page.tsx.
    onSave(payload as unknown as TPayload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className="text-xl">
              {isEditMode ? `Edit ${nounSingular}` : `Add ${nounSingular}`}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-6 max-h-[70vh] overflow-y-auto">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {formError}
              </div>
            )}

            <Input
              label={`${nounSingular} Name`}
              placeholder={`e.g. Standard ${nounSingular}`}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              disabled={isSaving}
            />

            <Input
              label={`${nounSingular} Code`}
              placeholder="e.g. STD01"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              error={errors.code}
              disabled={isSaving}
            />

            {extraFields.map((field) => {
              if (field.type === "time") {
                return (
                  <div key={field.key} className="w-full">
                    <label
                      htmlFor={`master-field-${field.key}`}
                      className="mb-1.5 block text-sm font-semibold text-ink"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`master-field-${field.key}`}
                      type="time"
                      value={(formData[field.key] as string) ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      disabled={isSaving}
                      className={[
                        "w-full h-12 rounded-lg border px-4 text-sm text-ink outline-none transition",
                        errors[field.key]
                          ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                          : "border-border bg-[#F2F2F2] focus:border-primary focus:bg-[#F2F2F2] focus:ring-4 focus:ring-primary-soft",
                      ].join(" ")}
                    />
                    {errors[field.key] && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors[field.key]}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === "days") {
                return (
                  <Select
                    key={field.key}
                    label={field.label}
                    placeholder="Select days"
                    isMultiSelect
                    options={WEEKDAYS.map((day) => ({ label: day, value: day }))}
                    value={(formData[field.key] as string[]) ?? []}
                    onChange={(value) => handleChange(field.key, value)}
                    error={errors[field.key]}
                  />
                );
              }

              return (
                <Input
                  key={field.key}
                  type="number"
                  label={field.label}
                  step={field.type === "number" ? field.step ?? "0.01" : "1"}
                  min={field.min ?? 0}
                  value={(formData[field.key] as string | number | undefined) ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  error={errors[field.key]}
                  disabled={isSaving}
                />
              );
            })}

            <Textarea
              label="Description (optional)"
              placeholder={`Short description of this ${nounSingular.toLowerCase()}`}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              error={errors.description}
              disabled={isSaving}
            />

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="pr-4">
                <p className="text-sm font-semibold text-ink">Active</p>
                <p className="text-xs text-muted">
                  The list API only ever returns active records - turning this off will make
                  the record disappear from this list after saving, and it cannot be
                  reactivated from here.
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onChange={(checked) => handleChange("is_active", checked)}
                disabled={isSaving}
                ariaLabel="Active"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {isEditMode ? "Save Changes" : `Add ${nounSingular}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
