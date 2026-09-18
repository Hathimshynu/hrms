"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils/utils";

interface AttendanceCalendarProps {
  /** Currently selected day */
  selected: Date | null;
  /** Called when a day is clicked */
  onSelect: (date: Date) => void;
  /** Extra leave / holiday dates beyond Sundays, e.g. ["2026-08-15", "2026-08-28"] */
  leaveDates?: string[];
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

/** Company holidays / declared leave dates (yyyy-MM-dd) */
const DEFAULT_LEAVE_DATES = ["2026-08-15", "2026-08-28"];

export function AttendanceCalendar({
  selected,
  onSelect,
  leaveDates = DEFAULT_LEAVE_DATES,
  className,
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => selected ?? new Date(),
  );

  const leaveDateSet = React.useMemo(() => new Set(leaveDates), [leaveDates]);

  /* ---------------------------------------------------------------------- */
  /* Build full 7-column (Sun-Sat) grid for the visible month               */
  /* ---------------------------------------------------------------------- */

  const days = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });

    return eachDayOfInterval({
      start: gridStart,
      end: addDays(gridStart, 41), // 6 full weeks
    });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(now);
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

      <div className="flex shrink-0 items-center gap-4 px-5 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs text-muted">Working Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-xs text-muted">Leave / Holiday</span>
        </div>
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

      <div className="grid flex-1 grid-cols-7 grid-rows-6 border-t border-border">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const active = selected ? isSameDay(day, selected) : false;
          const today = isToday(day);

          const isSunday = day.getDay() === 0;
          const isLeave = isSunday || leaveDateSet.has(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "relative flex w-full flex-col items-center justify-center gap-0.5 border-r border-b border-border text-sm transition-colors nth-[7n]:border-r-0",
                !inMonth && "opacity-30",
                isLeave
                  ? "bg-red-50 hover:bg-red-100"
                  : "bg-primary-soft hover:bg-primary-soft/70",
                active && "ring-2 ring-inset ring-primary",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  today
                    ? "bg-primary text-white"
                    : isLeave
                      ? "text-red-600"
                      : "text-primary-dark",
                )}
              >
                {format(day, "d")}
              </span>

              <span
                className={cn(
                  "text-[0.6rem] font-medium",
                  isLeave ? "text-red-500" : "text-primary",
                )}
              >
                {/* {isLeave ? (isSunday ? "Sunday" : "Leave") : "Working"} */}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
