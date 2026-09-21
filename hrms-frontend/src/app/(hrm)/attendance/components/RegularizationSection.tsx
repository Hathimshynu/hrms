"use client";

import { ExportMenu } from "@/src/components/common/ExportMenu";
import { downloadServerExport } from "@/src/lib/export/download";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { StatusPill } from "@/src/components/ui/Datatable";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDate } from "@/src/lib/date/format";
import { regularizationService } from "@/src/lib/attendance/regularization.service";
import type { RegularizationRecord } from "@/src/lib/attendance/attendance.types";
import { Plus } from "lucide-react";
import * as React from "react";

const EMPTY_FORM = {
  attendance_date: "",
  requested_check_in: "",
  requested_check_out: "",
  reason: "",
  description: "",
};

export function RegularizationSection() {
  const [records, setRecords] = React.useState<RegularizationRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const [cancellingId, setCancellingId] = React.useState<number | null>(null);

  const loadRecords = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await regularizationService.list();
      setRecords(result.data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load regularizations.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRecords(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadRecords]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setFormError(null);
    setErrors({});

    if (!formData.requested_check_in && !formData.requested_check_out) {
      setErrors({ requested_check_in: "Provide a requested check-in or check-out time." });
      return;
    }

    setIsSaving(true);
    try {
      await regularizationService.create({
        attendance_date: formData.attendance_date,
        requested_check_in: formData.requested_check_in || undefined,
        requested_check_out: formData.requested_check_out || undefined,
        reason: formData.reason,
        description: formData.description || undefined,
      });
      setIsDialogOpen(false);
      setFormData(EMPTY_FORM);
      await loadRecords();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to submit regularization.");
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await regularizationService.cancel(id);
      await loadRecords();
    } catch {
      // Surfaced implicitly by the record staying "Pending" - list reload
      // below will show the real current state either way.
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Attendance Regularization</h3>
        <div className="flex items-center gap-2">
        <ExportMenu
          compact
          label="my regularizations"
          onExport={(format) => downloadServerExport("/attendance/regularizations/export", {}, format, "my-regularizations")}
        />
        <Button
          size="sm"
          onClick={() => {
            setFormData(EMPTY_FORM);
            setFormError(null);
            setErrors({});
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Request
        </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        </div>
      )}

      {!isLoading && loadError && <InlineBanner type="error" message={loadError} />}

      {!isLoading && !loadError && records.length === 0 && (
        <p className="py-4 text-center text-sm text-muted">No regularization requests yet.</p>
      )}

      {!isLoading && !loadError && records.length > 0 && (
        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{formatDate(record.attendance_date)}</p>
                <p className="truncate text-xs text-muted">{record.reason}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusPill status={record.status} />
                {record.status === "Pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={cancellingId === record.id}
                    onClick={() => handleCancel(record.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden p-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
              <DialogTitle className="text-xl">Request Attendance Regularization</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 px-6 py-6">
              {formError && <InlineBanner type="error" message={formError} />}

              <Input
                label="Attendance Date"
                type="date"
                value={formData.attendance_date}
                onChange={(e) => handleChange("attendance_date", e.target.value)}
                error={errors.attendance_date}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Requested Check-In"
                  type="datetime-local"
                  value={formData.requested_check_in}
                  onChange={(e) => handleChange("requested_check_in", e.target.value)}
                  error={errors.requested_check_in}
                />
                <Input
                  label="Requested Check-Out"
                  type="datetime-local"
                  value={formData.requested_check_out}
                  onChange={(e) => handleChange("requested_check_out", e.target.value)}
                  error={errors.requested_check_out}
                />
              </div>

              <Input
                label="Reason"
                placeholder="e.g. Forgot to check in"
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                error={errors.reason}
              />

              <Textarea
                label="Description (optional)"
                placeholder="Additional details"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                error={errors.description}
              />
            </div>

            <DialogFooter className="px-6 py-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
