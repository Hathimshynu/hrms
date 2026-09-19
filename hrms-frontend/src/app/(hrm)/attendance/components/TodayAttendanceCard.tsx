"use client";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import { getCurrentPosition } from "@/src/hooks/useGeolocation";
import { parseApiError } from "@/src/lib/api/errors";
import { formatTime } from "@/src/lib/date/format";
import { attendanceService } from "@/src/lib/attendance/attendance.service";
import type { AttendanceRecord } from "@/src/lib/attendance/attendance.types";
import { CheckCircle2, Clock, LogIn, LogOut } from "lucide-react";
import * as React from "react";

interface TodayAttendanceCardProps {
  onChanged?: () => void;
  // Result already fetched by the page's profile probe (avoids a duplicate request).
  initial?: AttendanceRecord | null;
}

export function TodayAttendanceCard({ onChanged, initial }: TodayAttendanceCardProps) {
  const [today, setToday] = React.useState<AttendanceRecord | null>(initial ?? null);
  const [isLoading, setIsLoading] = React.useState(initial === undefined);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const loadToday = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setToday(await attendanceService.today());
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load today's attendance.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initial !== undefined) return;
    loadToday(); // eslint-disable-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadToday]);

  const handleCheckIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const position = await getCurrentPosition();
      const result = await attendanceService.checkIn({
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      });
      setToday(result.data);
      onChanged?.();
    } catch (err) {
      setActionError(
        err instanceof Error && !("response" in err)
          ? err.message
          : parseApiError(err, "Check-in failed.").message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const position = await getCurrentPosition();
      const result = await attendanceService.checkOut({
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      });
      setToday(result.data);
      onChanged?.();
    } catch (err) {
      setActionError(
        err instanceof Error && !("response" in err)
          ? err.message
          : parseApiError(err, "Check-out failed.").message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCheckedIn = !!today?.check_in_at;
  const hasCheckedOut = !!today?.check_out_at;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Today&apos;s Attendance</h3>
        {today?.status && (
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            {today.status}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        </div>
      )}

      {!isLoading && loadError && <InlineBanner type="error" message={loadError} />}

      {!isLoading && !loadError && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <div className="text-xs font-medium text-muted">Check In</div>
              <div className="mt-1 text-lg font-semibold text-emerald-700">
                {formatTime(today?.check_in_at ?? null)}
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <div className="text-xs font-medium text-muted">Check Out</div>
              <div className="mt-1 text-lg font-semibold text-blue-700">
                {formatTime(today?.check_out_at ?? null)}
              </div>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-center">
              <div className="text-xs font-medium text-muted">Work Hours</div>
              <div className="mt-1 text-lg font-semibold text-purple-700">
                {today?.work_hours ?? "--"}
              </div>
            </div>
          </div>

          {actionError && <div className="mb-3"><InlineBanner type="error" message={actionError} /></div>}

          {!hasCheckedIn && (
            <Button onClick={handleCheckIn} isLoading={isSubmitting} fullWidth>
              <LogIn className="mr-2 h-4 w-4" />
              Check In
            </Button>
          )}

          {hasCheckedIn && !hasCheckedOut && (
            <Button onClick={handleCheckOut} isLoading={isSubmitting} fullWidth variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          )}

          {hasCheckedIn && hasCheckedOut && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Attendance completed for today
              {today?.overtime_hours && Number(today.overtime_hours) > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 text-amber-700">
                  <Clock className="h-3.5 w-3.5" />
                  +{today.overtime_hours}h overtime
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
