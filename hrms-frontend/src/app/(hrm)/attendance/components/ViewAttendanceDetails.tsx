"use client";

import { Button } from "@/src/components/ui/Button";
import { Avatar } from "@/src/components/ui/Datatable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { format, parse } from "date-fns";
import {
  AlertCircle,
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Clock as ClockIcon,
  Coffee,
  FileText,
  LogIn,
  LogOut,
  Moon,
  Sun,
  Timer,
  Utensils,
  X,
  XCircle,
} from "lucide-react";
import * as React from "react";

type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "Half Day"
  | "On Leave"
  | "Work From Home";

interface Attendance {
  id: string;
  employeeId: string;
  name: string;
  avatar?: string;
  jobTitle: string;
  department: string;
  site: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string;
  status: AttendanceStatus;
  // Extended fields for detailed timeline
  breakStart?: string | null;
  breakEnd?: string | null;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  overtime?: string;
  productivity?: string;
}

interface ViewAttendanceDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance | null;
  onClose?: () => void;
  onExport?: (attendance: Attendance) => void;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Late: "bg-amber-50 text-amber-700 border-amber-200",
  "Work From Home": "bg-blue-50 text-blue-700 border-blue-200",
  "Half Day": "bg-purple-50 text-purple-700 border-purple-200",
  "On Leave": "bg-pink-50 text-pink-700 border-pink-200",
  Absent: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<AttendanceStatus, React.ReactNode> = {
  Present: <CheckCircle className="h-4 w-4" />,
  Late: <AlertCircle className="h-4 w-4" />,
  "Work From Home": <Briefcase className="h-4 w-4" />,
  "Half Day": <ClockIcon className="h-4 w-4" />,
  "On Leave": <Calendar className="h-4 w-4" />,
  Absent: <XCircle className="h-4 w-4" />,
};

export function ViewAttendanceDetails({
  open,
  onOpenChange,
  attendance,
  onClose,
  onExport,
}: ViewAttendanceDetailsProps) {
  if (!attendance) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, "MMM d, yyyy", new Date());
      return format(date, "EEEE, MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const InfoItem = ({
    icon,
    label,
    value,
    className = "",
  }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg ${className}`}
    >
      <div className="mt-0.5 text-muted">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </div>
        <div className="text-sm font-medium text-ink mt-0.5 wrap-break-word">
          {value}
        </div>
      </div>
    </div>
  );

  const TimelineStep = ({
    label,
    time,
    description,
    icon,
    isCompleted,
    isActive,
    isLast,
    statusText,
    statusColor,
  }: {
    label: string;
    time: string;
    description?: string;
    icon: React.ReactNode;
    isCompleted: boolean;
    isActive?: boolean;
    isLast: boolean;
    statusText?: string;
    statusColor?: string;
  }) => (
    <div className="relative flex items-start gap-4">
      {!isLast && (
        <div
          className={`absolute left-4 top-8 bottom-0 w-0.5 ${
            isCompleted ? "bg-emerald-500" : "bg-gray-200"
          }`}
        ></div>
      )}

      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
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
            <div className="flex items-center gap-2">
              <p
                className={`font-semibold ${
                  isActive
                    ? "text-amber-700"
                    : isCompleted
                      ? "text-ink"
                      : "text-gray-400"
                }`}
              >
                {label}
              </p>
              {statusText && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    statusColor || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {statusText}
                </span>
              )}
            </div>
            {description && (
              <p
                className={`text-sm ${
                  isActive
                    ? "text-amber-600"
                    : isCompleted
                      ? "text-muted"
                      : "text-gray-400"
                }`}
              >
                {description}
              </p>
            )}
          </div>
          <span
            className={`text-xs font-mono whitespace-nowrap ${
              isActive
                ? "text-amber-700 font-semibold"
                : isCompleted
                  ? "text-muted"
                  : "text-gray-400"
            }`}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  );

  const getTimelineSteps = () => {
    const steps = [];

    // 1. Login / Start of Day
    steps.push({
      label: "Login / Start of Day",
      time: attendance.checkIn || "Not logged in",
      description: attendance.checkIn
        ? "Employee started their work day"
        : "Employee hasn't logged in yet",
      icon: <LogIn className="h-5 w-5" />,
      isCompleted: !!attendance.checkIn,
      isActive: false,
      statusText: attendance.checkIn ? "Completed" : "Pending",
      statusColor: attendance.checkIn
        ? "bg-emerald-100 text-emerald-700"
        : "bg-gray-100 text-gray-600",
    });

    // 2. Morning Break Start
    if (attendance.breakStart) {
      steps.push({
        label: "Morning Break Started",
        time: attendance.breakStart,
        description: "Employee took a short break",
        icon: <Coffee className="h-5 w-5" />,
        isCompleted: true,
        isActive: false,
        statusText: "Completed",
        statusColor: "bg-emerald-100 text-emerald-700",
      });
    }

    // 3. Morning Break End
    if (attendance.breakEnd) {
      steps.push({
        label: "Morning Break Ended",
        time: attendance.breakEnd,
        description: "Employee resumed work after break",
        icon: <Clock className="h-5 w-5" />,
        isCompleted: true,
        isActive: false,
        statusText: "Completed",
        statusColor: "bg-emerald-100 text-emerald-700",
      });
    }

    // 4. Lunch Break Start
    if (attendance.lunchStart) {
      steps.push({
        label: "Lunch Break Started",
        time: attendance.lunchStart,
        description: "Employee went for lunch",
        icon: <Utensils className="h-5 w-5" />,
        isCompleted: true,
        isActive: false,
        statusText: "Completed",
        statusColor: "bg-emerald-100 text-emerald-700",
      });
    }

    // 5. Lunch Break End
    if (attendance.lunchEnd) {
      steps.push({
        label: "Lunch Break Ended",
        time: attendance.lunchEnd,
        description: "Employee returned from lunch",
        icon: <Sun className="h-5 w-5" />,
        isCompleted: true,
        isActive: false,
        statusText: "Completed",
        statusColor: "bg-emerald-100 text-emerald-700",
      });
    }

    // 6. Work Completed / Logout
    if (attendance.checkOut) {
      steps.push({
        label: "Work Completed / Logout",
        time: attendance.checkOut,
        description: "Employee finished their work day",
        icon: <LogOut className="h-5 w-5" />,
        isCompleted: true,
        isActive: false,
        statusText: "Completed",
        statusColor: "bg-emerald-100 text-emerald-700",
      });
    } else if (attendance.checkIn && !attendance.checkOut) {
      // Still working - active step
      steps.push({
        label: "Currently Working",
        time: "In Progress",
        description: "Employee is still at work",
        icon: <Timer className="h-5 w-5" />,
        isCompleted: false,
        isActive: true,
        statusText: "Active",
        statusColor: "bg-amber-100 text-amber-700",
      });
    }

    // 7. Overtime (if applicable)
    if (attendance.overtime && parseFloat(attendance.overtime) > 0) {
      steps.push({
        label: "Overtime Work",
        time: attendance.overtime,
        description: "Employee worked extra hours",
        icon: <Award className="h-5 w-5" />,
        isCompleted: true,
        isActive: false,
        statusText: "Extra Hours",
        statusColor: "bg-blue-100 text-blue-700",
      });
    }

    // 8. Status-specific steps for special cases
    if (attendance.status === "Absent") {
      steps.push({
        label: "Absent",
        time: attendance.date,
        description: "Employee was absent for the day",
        icon: <XCircle className="h-5 w-5" />,
        isCompleted: false,
        isActive: false,
        statusText: "Absent",
        statusColor: "bg-red-100 text-red-700",
      });
    }

    if (attendance.status === "Half Day") {
      steps.push({
        label: "Half Day",
        time: attendance.checkOut || "Early departure",
        description: "Employee worked only half day",
        icon: <Moon className="h-5 w-5" />,
        isCompleted: !!attendance.checkOut,
        isActive: false,
        statusText: "Half Day",
        statusColor: "bg-purple-100 text-purple-700",
      });
    }

    return steps;
  };

  const timelineSteps = getTimelineSteps();

  const handleExport = () => {
    if (onExport) {
      onExport(attendance);
    } else {
      console.log("Exporting attendance:", attendance);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="bg-primary text-primary-foreground px-6 py-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attendance Details
          </DialogTitle>
          <button
            onClick={() => {
              onOpenChange(false);
              if (onClose) onClose();
            }}
            className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-12rem)] p-6">
          {/* Employee Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 pb-6 border-b">
            <div className="flex items-center gap-4">
              <Avatar src={attendance.avatar} name={attendance.name} />
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  {attendance.name}
                </h3>
                <p className="text-sm text-muted">{attendance.jobTitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted">
                    ID: {attendance.employeeId}
                  </span>
                  <span className="text-xs text-muted">•</span>
                  <span className="text-xs text-muted">
                    {formatDate(attendance.date)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <span
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border ${STATUS_COLORS[attendance.status]}`}
              >
                {STATUS_ICONS[attendance.status]}
                {attendance.status}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted font-medium">Check In</div>
              <div className="text-lg font-semibold text-emerald-700 mt-1">
                {attendance.checkIn ?? "--"}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted font-medium">Check Out</div>
              <div className="text-lg font-semibold text-blue-700 mt-1">
                {attendance.checkOut ?? "--"}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted font-medium">Work Hours</div>
              <div className="text-lg font-semibold text-purple-700 mt-1">
                {attendance.workHours}
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted font-medium">Productivity</div>
              <div className="text-lg font-semibold text-amber-700 mt-1">
                {attendance.productivity || "92%"}
              </div>
            </div>
          </div>

          {/* Detailed Timeline / Stepper */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted" />
              Daily Activity Timeline
            </h4>
            <div className="relative">
              {timelineSteps.map((step, index) => (
                <TimelineStep
                  key={index}
                  {...step}
                  isLast={index === timelineSteps.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dialog Footer with Export Button */}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
          <div className="flex w-full flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                if (onClose) onClose();
              }}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleExport}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Details
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
