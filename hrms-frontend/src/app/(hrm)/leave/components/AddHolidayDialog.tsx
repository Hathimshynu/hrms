"use client";

import { Button } from "@/src/components/ui/Button";

import { Calendar } from "@/src/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/Input";
import { Select, type SelectOption } from "@/src/components/ui/Select";
import { Switch } from "@/src/components/ui/Switch";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isValid,
  parseISO,
  startOfMonth,
} from "date-fns";
import { CalendarDays, RefreshCw, X } from "lucide-react";
import * as React from "react";
import { Holiday, HolidayType } from "../policy/page";

const HOLIDAY_TYPE_OPTIONS: SelectOption[] = [
  { label: "Festival", value: "Festival" },
  { label: "National", value: "National" },
  { label: "Regional", value: "Regional" },
  { label: "Optional", value: "Optional" },
];

// Color mapping for holiday types
const HOLIDAY_TYPE_COLORS: Record<HolidayType, string> = {
  Festival: "bg-purple-500",
  National: "bg-blue-500",
  Regional: "bg-teal-500",
  Optional: "bg-amber-500",
};

const EMPTY_HOLIDAY: Holiday = {
  id: "",
  name: "",
  date: format(new Date(), "yyyy-MM-dd"),
  type: "Festival",
  recurringYearly: true,
};

interface AddHolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday: Holiday | null;
  mode: "create" | "edit";
  onSave: (holiday: Holiday) => void;
  existingHolidays?: Holiday[];
}

export function AddHolidayDialog({
  open,
  onOpenChange,
  holiday,
  mode,
  onSave,
  existingHolidays = [],
}: AddHolidayDialogProps) {
  const [form, setForm] = React.useState<Holiday>(EMPTY_HOLIDAY);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date(),
  );
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (open) {
      if (holiday && holiday.date) {
        try {
          const parsedDate = parseISO(holiday.date);
          if (isValid(parsedDate)) {
            setForm(holiday);
            setSelectedDate(parsedDate);
            setCurrentMonth(parsedDate);
          } else {
            setForm(EMPTY_HOLIDAY);
            setSelectedDate(new Date());
            setCurrentMonth(new Date());
          }
        } catch (error) {
          setForm(EMPTY_HOLIDAY);
          setSelectedDate(new Date());
          setCurrentMonth(new Date());
        }
      } else {
        setForm(EMPTY_HOLIDAY);
        setSelectedDate(new Date());
        setCurrentMonth(new Date());
      }
    }
  }, [holiday, open]);

  const update = <K extends keyof Holiday>(key: K, value: Holiday[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleClose = () => onOpenChange(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  // Get holidays for a date (including recurring)
  const getHolidaysForDate = (date: Date): Holiday[] => {
    if (!isValid(date)) return [];
    const holidayId = form.id;
    return existingHolidays.filter((h) => {
      if (h.id === holidayId) return false;
      try {
        const holidayDate = parseISO(h.date);
        if (!isValid(holidayDate)) return false;

        // Check exact date match
        if (isSameDay(holidayDate, date)) return true;

        // Check recurring match
        if (h.recurringYearly) {
          return (
            holidayDate.getMonth() === date.getMonth() &&
            holidayDate.getDate() === date.getDate()
          );
        }

        return false;
      } catch (error) {
        return false;
      }
    });
  };

  // Custom day renderer
  const renderDay = (date: Date) => {
    if (!date || !isValid(date)) return null;

    const dayNumber = format(date, "d");
    const isSelected =
      selectedDate && isValid(selectedDate) && isSameDay(date, selectedDate);
    const holidays = getHolidaysForDate(date);
    const hasHoliday = holidays.length > 0;
    const isToday = isSameDay(date, new Date());
    const isHovered =
      hoveredDate && isValid(hoveredDate) && isSameDay(date, hoveredDate);

    const showHolidayTooltip = isHovered && hasHoliday;

    return (
      <div
        className="relative flex h-full w-full items-center justify-center"
        onMouseEnter={(e) => {
          if (hasHoliday) {
            setHoveredDate(date);
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
            });
          }
        }}
        onMouseLeave={() => setHoveredDate(null)}
      >
        {/* Date number */}
        <span
          className={`
            relative z-10 h-8 w-8 rounded-full flex items-center justify-center text-sm
            transition-all duration-200
            ${isSelected ? "bg-primary text-white font-semibold shadow-lg" : ""}
            ${hasHoliday && !isSelected ? "text-red-600 font-semibold" : ""}
            ${isToday && !isSelected && !hasHoliday ? "border-2 border-primary text-primary font-semibold" : ""}
            ${!isSelected && !hasHoliday ? "hover:bg-gray-100" : ""}
          `}
        >
          {dayNumber}
        </span>

        {/* Multiple holidays indicator (kept from your original logic) */}
        {hasHoliday && holidays.length > 1 && (
          <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary/80 border border-white text-[6px] font-bold text-white flex items-center justify-center">
            {holidays.length}
          </div>
        )}

        {/* Tooltip on hover (kept from your original logic) */}
        {showHolidayTooltip && holidays.length > 0 && (
          <div
            className="fixed z-100 pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 max-w-xs min-w-45">
              <div className="font-semibold text-white/90 mb-1.5">
                {holidays.length === 1
                  ? "Holiday"
                  : `${holidays.length} Holidays`}
              </div>
              <div className="space-y-1.5">
                {holidays.slice(0, 3).map((h) => (
                  <div key={h.id} className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${HOLIDAY_TYPE_COLORS[h.type]}`}
                    />
                    <span className="text-white/90">{h.name}</span>
                    {h.recurringYearly && (
                      <RefreshCw className="h-2.5 w-2.5 text-white/50" />
                    )}
                  </div>
                ))}
                {holidays.length > 3 && (
                  <div className="text-white/50 text-[10px] mt-1">
                    +{holidays.length - 3} more
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get holidays for legend
  const getHolidaysForMonth = () => {
    if (!isValid(currentMonth)) return [];

    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start, end });
      const holidayTypes: HolidayType[] = [];

      days.forEach((day) => {
        const holidays = getHolidaysForDate(day);
        holidays.forEach((h) => {
          if (!holidayTypes.includes(h.type)) {
            holidayTypes.push(h.type);
          }
        });
      });

      return holidayTypes;
    } catch (error) {
      return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="bg-primary text-primary-foreground px-6 py-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {mode === "create" ? "Add Holiday" : "Edit Holiday"}
          </DialogTitle>
          <button
            onClick={handleClose}
            className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Holiday Name"
                placeholder="e.g. Diwali"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />

              <Select
                label="Type"
                options={HOLIDAY_TYPE_OPTIONS}
                value={form.type}
                onChange={(value) => update("type", value as HolidayType)}
                clearable={false}
              />
            </div>

            <div className="rounded-lg border border-border bg-white p-3 relative">
              <div className="w-full max-w-75 mx-auto">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date && isValid(date)) {
                      setSelectedDate(date);
                      update("date", format(date, "yyyy-MM-dd"));
                    }
                  }}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  captionLayout="dropdown"
                  className="w-full"
                  styles={{
                    day: {
                      height: "40px",
                      width: "40px",
                    },
                  }}
                  components={{
                    Day: ({ day, ...props }: any) => {
                      if (!day || !isValid(day)) {
                        // FIXED: Changed to <td> to maintain valid HTML structure
                        return (
                          <td {...props} colSpan={1} className="h-8 w-8" />
                        );
                      }

                      const holidays = getHolidaysForDate(day);
                      const hasHoliday = holidays.length > 0;
                      const dayContent = renderDay(day);

                      return (
                        // FIXED: Added dynamic background to the cell based on holidays
                        <td
                          {...props}
                          className={`relative ${hasHoliday ? "bg-red-50" : ""}`}
                        >
                          {dayContent}
                        </td>
                      );
                    },
                  }}
                />
              </div>
            </div>

            {/* Legend with actual holidays in current month */}
            <div className="flex flex-wrap items-center gap-3 px-2">
              <span className="text-xs font-medium text-muted">Legend:</span>
              {getHolidaysForMonth().map((type) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${HOLIDAY_TYPE_COLORS[type]}`}
                  />
                  <span className="text-xs text-muted">{type}</span>
                </div>
              ))}
              {getHolidaysForMonth().length === 0 && (
                <span className="text-xs text-muted">
                  No holidays in this month
                </span>
              )}
              <div className="flex items-center gap-1.5 ml-2">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-xs text-muted">Selected</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">
                    Repeats Every Year
                  </div>
                  <div className="text-xs text-muted">
                    Automatically apply this holiday on the same date each year
                  </div>
                </div>
              </div>
              <Switch
                checked={form.recurringYearly}
                onChange={(checked) => update("recurringYearly", checked)}
                ariaLabel="Repeats every year"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
            <div className="flex w-full flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white"
              >
                {mode === "create" ? "Add Holiday" : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
