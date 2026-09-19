"use client";

import { getTodayIST, todayISTAsLocalDate } from "@/src/lib/date/format";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/src/components/ui/Button";
import type { AttendanceStatus } from "@/src/lib/attendance/attendance.types";
import { cn } from "@/src/lib/utils/utils";

interface AttendanceCalendarProps {
  /** Currently selected day */
  selected: Date | null;
  /** Called when a day is clicked */
  onSelect: (date: Date) => void;
  /** Called whenever the visible month changes, so the parent can fetch that month's data */
  onMonthChange?: (month: Date) => void;
  /** Real backend status per day (yyyy-MM-dd -> status), from GET /attendance/calendar */
  statusByDate?: Record<string, AttendanceStatus>;
  isLoading?: boolean;
  className?: string;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Matches the real `attendances.status` enum (hrms-backend migration) -
// only statuses that can actually be returned are styled here.
const STATUS_DOT: Record<AttendanceStatus, string> = {
  Present: "bg-emerald-500",
  Late: "bg-amber-500",
  "Half Day": "bg-orange-500",
  "On Leave": "bg-purple-500",
  Absent: "bg-red-500",
  Holiday: "bg-pink-500",
  "Week Off": "bg-slate-400",
};

export function AttendanceCalendar({
  selected,
  onSelect,
  onMonthChange,
  statusByDate = {},
  isLoading = false,
  className,
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => selected ?? todayISTAsLocalDate(),
  );

  const days = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });

    return eachDayOfInterval({
      start: gridStart,
      end: addDays(gridStart, 41), // 6 full weeks
    });
  }, [currentMonth]);

  const changeMonth = (next: Date) => {
    setCurrentMonth(next);
    onMonthChange?.(next);
  };

  const handlePrevMonth = () => changeMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => changeMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const now = todayISTAsLocalDate();
    changeMonth(now);
    onSelect(now);
  };

  return (
    <div
      className={cn(
        "flex h-120 flex-col overflow-hidden rounded-2xl border border-border bg-surface",
        className,
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="text-lg font-semibold text-ink">
          {format(currentMonth, "MMMM yyyy")}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-surface-muted hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full px-3 text-xs font-medium"
            onClick={handleToday}
          >
            Today
          </Button>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-surface-muted hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 px-5 pb-2">
        {(Object.keys(STATUS_DOT) as AttendanceStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} />
            <span className="text-xs text-muted">{status}</span>
          </div>
        ))}
      </div>

      <div className="grid shrink-0 grid-cols-7 border-t border-border bg-surface-muted">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="border-r border-border px-2 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-muted last:border-r-0"
          >
            {label.slice(0, 3)}
          </div>
        ))}
      </div>

      <div className="relative grid flex-1 grid-cols-7 grid-rows-6 border-t border-border">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
          </div>
        )}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const active = selected ? isSameDay(day, selected) : false;
          const today = key === getTodayIST();
          const status = statusByDate[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "relative flex w-full flex-col items-center justify-center gap-1 border-r border-b border-border text-sm transition-colors nth-[7n]:border-r-0",
                !inMonth && "opacity-30",
                "bg-surface hover:bg-surface-muted",
                active && "ring-2 ring-inset ring-primary",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  today ? "bg-primary text-white" : "text-ink",
                )}
              >
                {format(day, "d")}
              </span>

              {status && <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
