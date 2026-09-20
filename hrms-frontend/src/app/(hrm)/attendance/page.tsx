"use client";

import {
  Avatar,
  Column,
  DataTable,
  StatusPill,
} from "@/src/components/ui/Datatable";
import { Select } from "@/src/components/ui/Select";

import { format } from "date-fns";
import { formatDate, formatTime, localDateKey, todayISTAsLocalDate } from "@/src/lib/date/format";
import { ArrowLeft } from "lucide-react";
import * as React from "react";
import dynamic from "next/dynamic";
import { RegularizationReview } from "./components/RegularizationReview";
import { TimesheetSummary } from "./components/TimesheetSummary";
import { AttendanceCalendar } from "./components/AttendanceCalendar";
import { AbsenceReview } from "./components/AbsenceReview";
import { MyAbsence } from "./components/MyAbsence";
import { MyAttendanceHistory } from "./components/MyAttendanceHistory";
import { RegularizationSection } from "./components/RegularizationSection";
import { TodayAttendanceCard } from "./components/TodayAttendanceCard";
import { ViewAttendanceDetails } from "./components/ViewAttendanceDetails";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { usePermission } from "@/src/hooks/usePermission";
import { attendanceService } from "@/src/lib/attendance/attendance.service";
import type {
  AttendanceRecord,
  AttendanceRecordWithEmployee,
  AttendanceStatus,
} from "@/src/lib/attendance/attendance.types";
import { parseApiError } from "@/src/lib/api/errors";
import { MENU_MODULES } from "@/src/permissions/permissions";

// Matches the real `attendances.status` enum exactly (hrms-backend migration).
const STATUS_OPTIONS: { label: string; value: AttendanceStatus }[] = [
  { label: "Present", value: "Present" },
  { label: "Late", value: "Late" },
  { label: "Half Day", value: "Half Day" },
  { label: "On Leave", value: "On Leave" },
  { label: "Absent", value: "Absent" },
  { label: "Holiday", value: "Holiday" },
  { label: "Week Off", value: "Week Off" },
];

const adminColumns: Column<AttendanceRecordWithEmployee>[] = [
  {
    key: "employee",
    header: "Employee",
    accessor: (row) => {
      const name = row.employee
        ? `${row.employee.first_name} ${row.employee.last_name}`.trim()
        : `Employee #${row.employee_id}`;
      return (
        <div className="flex items-center gap-3">
          <Avatar name={name} />
          <div className="min-w-0">
            <div className="font-medium text-ink truncate">{name}</div>
            <div className="text-xs text-muted truncate">{row.employee?.employee_code}</div>
          </div>
        </div>
      );
    },
    hideable: false,
  },
  {
    key: "department",
    header: "Department",
    accessor: (row) => row.employee?.department?.name ?? "—",
  },
  {
    key: "date",
    header: "Date",
    accessor: (row) => formatDate(row.attendance_date),
    sortValue: (row) => row.attendance_date ?? "",
  },
  {
    key: "checkIn",
    header: "Check In",
    accessor: (row) => (
      <span className={row.check_in_at ? "text-ink" : "text-muted"}>
        {row.check_in_at ? formatTime(row.check_in_at) : "--"}
      </span>
    ),
  },
  {
    key: "checkOut",
    header: "Check Out",
    accessor: (row) => (
      <span className={row.check_out_at ? "text-ink" : "text-muted"}>
        {row.check_out_at ? formatTime(row.check_out_at) : "--"}
      </span>
    ),
  },
  {
    key: "workHours",
    header: "Work Hours",
    accessor: (row) => <span className="font-medium text-ink">{row.work_hours ?? "--"}</span>,
  },
  {
    key: "status",
    header: "Status",
    accessor: (row) => <StatusPill status={row.status} />,
  },
];

// Recharts is only needed for the team view; keep it out of the initial bundle.
const AttendanceBarChart = dynamic(
  () => import("./components/AttendanceBarChart").then((m) => m.AttendanceBarChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-black/5" aria-hidden="true" /> },
);

export default function AttendancePage() {
  const { edit: canViewAll } = usePermission(MENU_MODULES.ATTENDANCE);

  // Probe once: a user with no linked employee profile gets 404 on every
  // self-service endpoint, so detect it here instead of firing four requests.
  const [profile, setProfile] = React.useState<"checking" | "linked" | "missing">("checking");
  const [todayProbe, setTodayProbe] = React.useState<AttendanceRecord | null | undefined>(undefined);
  React.useEffect(() => {
    let active = true;
    attendanceService
      .today()
      .then((rec) => {
        if (!active) return;
        setTodayProbe(rec);
        setProfile("linked");
      })
      .catch((err) => {
        if (!active) return;
        // Any non-404 error is left for the widgets to display themselves.
        setProfile(parseApiError(err).status === 404 ? "missing" : "linked");
      });
    return () => {
      active = false;
    };
  }, []);

  // Self-service monthly calendar
  const [calendarMonth, setCalendarMonth] = React.useState(() => todayISTAsLocalDate());
  const [calendarSelected, setCalendarSelected] = React.useState<Date | null>(() => todayISTAsLocalDate());
  const [calendarRecords, setCalendarRecords] = React.useState<AttendanceRecord[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = React.useState(true);
  const [calendarError, setCalendarError] = React.useState<string | null>(null);

  const loadCalendar = React.useCallback(async () => {
    setIsCalendarLoading(true);
    setCalendarError(null);
    try {
      const records = await attendanceService.calendar(format(calendarMonth, "yyyy-MM"));
      setCalendarRecords(records);
    } catch (err) {
      setCalendarError(parseApiError(err, "Failed to load attendance calendar.").message);
    } finally {
      setIsCalendarLoading(false);
    }
  }, [calendarMonth]);

  React.useEffect(() => {
    if (profile !== "linked") return;
    loadCalendar();
  }, [loadCalendar, profile]);

  const statusByDate = React.useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    calendarRecords.forEach((rec) => {
      if (rec.attendance_date) map[rec.attendance_date] = rec.status;
    });
    return map;
  }, [calendarRecords]);

  // Admin/HR section - only fetched when the user actually has edit
  // attendance (matches the Phase 5 IDOR fix in routes/api.php).
  const [adminStatus, setAdminStatus] = React.useState<string>("");
  const [adminRecords, setAdminRecords] = React.useState<AttendanceRecordWithEmployee[]>([]);
  const [isAdminLoading, setIsAdminLoading] = React.useState(false);
  const [adminError, setAdminError] = React.useState<string | null>(null);

  const adminDate = calendarSelected ? localDateKey(calendarSelected) : undefined;

  const loadAdminRecords = React.useCallback(async () => {
    if (!canViewAll) return;
    setIsAdminLoading(true);
    setAdminError(null);
    try {
      const result = await attendanceService.adminList({
        attendance_date: adminDate,
        status: (adminStatus as AttendanceStatus) || undefined,
        per_page: 50,
      });
      setAdminRecords(result.data);
    } catch (err) {
      setAdminError(parseApiError(err, "Failed to load attendance records.").message);
    } finally {
      setIsAdminLoading(false);
    }
  }, [canViewAll, adminDate, adminStatus]);

  React.useEffect(() => {
    loadAdminRecords();
  }, [loadAdminRecords]);

  const [selectedAttendance, setSelectedAttendance] =
    React.useState<AttendanceRecordWithEmployee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);

  const handleView = (row: AttendanceRecordWithEmployee) => {
    setSelectedAttendance(row);
    setIsViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedAttendance(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2]">
      <div className="sticky top-0 z-50 bg-[#F2F2F2] py-4 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-3 items-center min-w-0">
            <button type="button" aria-label="Go back"
              className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
            </button>
            <h1 className="text-lg sm:text-2xl font-light truncate">
              Attendance
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 grid grid-cols-[minmax(0,1fr)] gap-4">
        {profile === "missing" && (
          <div role="status" className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <p className="text-base font-semibold text-ink">Personal attendance unavailable</p>
            <p className="max-w-md text-sm text-ink-soft">No employee profile is linked to this user account, so check-in, history and the calendar are not available. Contact HR to link your account to an employee record.</p>
          </div>
        )}

        {profile === "checking" && <div className="h-64 animate-pulse rounded-2xl bg-black/5" aria-hidden="true" />}

        {profile === "linked" && (
        <>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
            <TodayAttendanceCard onChanged={loadCalendar} initial={todayProbe} />
            <RegularizationSection />
          </div>

          {calendarError && <InlineBanner type="error" message={calendarError} />}
          <AttendanceCalendar
            selected={calendarSelected}
            onSelect={setCalendarSelected}
            onMonthChange={setCalendarMonth}
            statusByDate={statusByDate}
            isLoading={isCalendarLoading}
          />
        </div>

        <TimesheetSummary month={calendarMonth} />

        <MyAbsence month={calendarMonth} />

        <MyAttendanceHistory />
        </>
        )}

        {canViewAll && <RegularizationReview canReview={canViewAll} />}

        {canViewAll && <AbsenceReview />}

        {canViewAll && (
          <>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">
                Team Attendance {calendarSelected ? `— ${formatDate(localDateKey(calendarSelected))}` : ""}
              </h2>
              <div className="w-48">
                <Select
                  placeholder="All statuses"
                  options={STATUS_OPTIONS}
                  value={adminStatus}
                  clearable
                  onChange={(v) => setAdminStatus((v as string) || "")}
                />
              </div>
            </div>

            {adminError && <InlineBanner type="error" message={adminError} />}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <DataTable
                data={adminRecords}
                columns={adminColumns}
                keyExtractor={(row) => row.id}
                pageSize={8}
                isLoading={isAdminLoading}
                emptyMessage="No attendance records for this date."
                onViewRow={handleView}
              />

              <AttendanceBarChart data={adminRecords} selectedDate={calendarSelected} />
            </div>
          </>
        )}
      </div>

      <ViewAttendanceDetails
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        attendance={selectedAttendance}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
