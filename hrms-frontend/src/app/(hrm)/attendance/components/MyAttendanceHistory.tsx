"use client";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Column, DataTable, StatusPill } from "@/src/components/ui/Datatable";
import { Input } from "@/src/components/ui/Input";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDate, formatTime } from "@/src/lib/date/format";
import { attendanceService } from "@/src/lib/attendance/attendance.service";
import type { AttendanceRecord } from "@/src/lib/attendance/attendance.types";
import * as React from "react";

const PAGE_SIZE = 10;

const columns: Column<AttendanceRecord>[] = [
  { key: "date", header: "Date", accessor: (row) => formatDate(row.attendance_date), sortValue: (row) => row.attendance_date ?? "" },
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
    key: "overtime",
    header: "Overtime",
    accessor: (row) => row.overtime_hours ?? "--",
  },
  {
    key: "status",
    header: "Status",
    accessor: (row) => <StatusPill status={row.status} />,
  },
];

export function MyAttendanceHistory() {
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadHistory = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await attendanceService.history({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
        per_page: PAGE_SIZE,
      });
      setRecords(result.data);
      setLastPage(result.last_page);
      setTotal(result.total);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load attendance history.").message);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, page]);

  React.useEffect(() => {
    loadHistory(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadHistory]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">My Attendance History</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
          <span className="text-sm text-muted">to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loadError && <InlineBanner type="error" message={loadError} />}

      <DataTable
        data={records}
        columns={columns}
        keyExtractor={(row) => row.id}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        emptyMessage="No attendance history found."
      />

      {!isLoading && total > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {page} of {lastPage} · {total} record{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
