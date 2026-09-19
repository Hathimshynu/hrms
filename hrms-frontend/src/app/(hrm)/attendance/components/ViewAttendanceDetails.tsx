"use client";

import { formatDate, formatDateTime } from "@/src/lib/date/format";
import { Button } from "@/src/components/ui/Button";
import { Avatar } from "@/src/components/ui/Datatable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { AttendanceRecordWithEmployee, AttendanceStatus } from "@/src/lib/attendance/attendance.types";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock as ClockIcon,
  FileText,
  LogIn,
  LogOut,
  Timer,
  X,
  XCircle,
} from "lucide-react";
import * as React from "react";

interface ViewAttendanceDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: AttendanceRecordWithEmployee | null;
  onClose?: () => void;
}

// Matches the real `attendances.status` enum exactly (hrms-backend migration).
const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Late: "bg-amber-50 text-amber-700 border-amber-200",
  "Half Day": "bg-purple-50 text-purple-700 border-purple-200",
  "On Leave": "bg-pink-50 text-pink-700 border-pink-200",
  Absent: "bg-red-50 text-red-700 border-red-200",
  Holiday: "bg-blue-50 text-blue-700 border-blue-200",
  "Week Off": "bg-slate-50 text-slate-700 border-slate-200",
};

const STATUS_ICONS: Record<AttendanceStatus, React.ReactNode> = {
  Present: <CheckCircle className="h-4 w-4" />,
  Late: <AlertCircle className="h-4 w-4" />,
  "Half Day": <ClockIcon className="h-4 w-4" />,
  "On Leave": <Calendar className="h-4 w-4" />,
  Absent: <XCircle className="h-4 w-4" />,
  Holiday: <Calendar className="h-4 w-4" />,
  "Week Off": <Calendar className="h-4 w-4" />,
};

export function ViewAttendanceDetails({
  open,
  onOpenChange,
  attendance,
  onClose,
}: ViewAttendanceDetailsProps) {
  if (!attendance) return null;

  const employeeName = attendance.employee
    ? `${attendance.employee.first_name} ${attendance.employee.last_name}`.trim()
    : `Employee #${attendance.employee_id}`;

  const TimelineStep = ({
    label,
    time,
    description,
    icon,
    isCompleted,
    isActive,
    isLast,
  }: {
    label: string;
    time: string;
    description: string;
    icon: React.ReactNode;
    isCompleted: boolean;
    isActive?: boolean;
    isLast: boolean;
  }) => (
    <div className="relative flex items-start gap-4">
      {!isLast && (
        <div
          className={`absolute left-4 top-8 bottom-0 w-0.5 ${
            isCompleted ? "bg-emerald-500" : "bg-gray-200"
          }`}
        />
      )}

      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
          isCompleted
            ? "border-emerald-500 bg-emerald-50 text-emerald-500"
            : isActive
              ? "border-amber-500 bg-amber-50 text-amber-500 ring-4 ring-amber-200"
              : "border-gray-300 bg-gray-50 text-gray-400"
        }`}
      >
        {isCompleted ? <CheckCircle className="h-5 w-5" /> : icon}
      </div>

      <div className="flex-1 min-w-0 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className={`font-semibold ${isCompleted ? "text-ink" : isActive ? "text-amber-700" : "text-gray-400"}`}>
              {label}
            </p>
            <p className={`text-sm ${isCompleted ? "text-muted" : isActive ? "text-amber-600" : "text-gray-400"}`}>
              {description}
            </p>
          </div>
          <span className="text-xs font-mono whitespace-nowrap text-muted">{time}</span>
        </div>
      </div>
    </div>
  );

  const steps = [
    {
      label: "Check In",
      time: formatDateTime(attendance.check_in_at),
      description: attendance.check_in_at ? "Employee checked in" : "Not checked in",
      icon: <LogIn className="h-5 w-5" />,
      isCompleted: !!attendance.check_in_at,
    },
    attendance.check_out_at
      ? {
          label: "Check Out",
          time: formatDateTime(attendance.check_out_at),
          description: "Employee checked out",
          icon: <LogOut className="h-5 w-5" />,
          isCompleted: true,
        }
      : attendance.check_in_at
        ? {
            label: "Still Working",
            time: "In Progress",
            description: "No check-out recorded yet",
            icon: <Timer className="h-5 w-5" />,
            isCompleted: false,
            isActive: true,
          }
        : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="bg-primary text-primary-foreground px-6 py-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attendance Details
          </DialogTitle>
          <button
            onClick={() => {
              onOpenChange(false);
              onClose?.();
            }}
            className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 pb-6 border-b">
            <div className="flex items-center gap-4">
              <Avatar name={employeeName} />
              <div>
                <h3 className="text-lg font-semibold text-ink">{employeeName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {attendance.employee?.employee_code && (
                    <>
                      <span className="text-xs text-muted">ID: {attendance.employee.employee_code}</span>
                      <span className="text-xs text-muted">•</span>
                    </>
                  )}
                  <span className="text-xs text-muted">{formatDate(attendance.attendance_date)}</span>
                </div>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border ${STATUS_COLORS[attendance.status]}`}
            >
              {STATUS_ICONS[attendance.status]}
              {attendance.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted font-medium">Check In</div>
              <div className="text-sm font-semibold text-emerald-700 mt-1">
                {attendance.check_in_at ? formatDateTime(attendance.check_in_at) : "--"}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted font-medium">Check Out</div>
              <div className="text-sm font-semibold text-blue-700 mt-1">
                {attendance.check_out_at ? formatDateTime(attendance.check_out_at) : "--"}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted font-medium">Work Hours</div>
              <div className="text-lg font-semibold text-purple-700 mt-1">
                {attendance.work_hours ?? "--"}
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted font-medium">Overtime</div>
              <div className="text-lg font-semibold text-amber-700 mt-1">
                {attendance.overtime_hours ?? "--"}
              </div>
            </div>
          </div>

          {attendance.notes && (
            <div className="mb-6 rounded-lg bg-gray-50 p-3 text-sm text-ink">
              <span className="font-medium">Notes: </span>
              {attendance.notes}
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted" />
              Activity Timeline
            </h4>
            <div className="relative">
              {steps.map((step, index) => (
                <TimelineStep key={index} {...step} isLast={index === steps.length - 1} />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onClose?.();
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
