"use client";

import { format, startOfMonth } from "date-fns";
import * as React from "react";

import { ExportMenu } from "@/src/components/common/ExportMenu";
import { downloadServerExport } from "@/src/lib/export/download";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import { StatusPill } from "@/src/components/ui/Datatable";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { parseApiError } from "@/src/lib/api/errors";
import {
  ABSENCE_LABELS,
  absenceService,
  type AbsenceAdminResponse,
  type AbsenceStatus,
} from "@/src/lib/attendance/absence.service";
import { formatDate, todayISTAsLocalDate } from "@/src/lib/date/format";
import { departmentService, type DepartmentDto } from "@/src/lib/departments/department.service";
import { employeeService, type EmployeeListItem } from "@/src/lib/employees/employee.service";

const STATUS_OPTIONS = (Object.keys(ABSENCE_LABELS) as AbsenceStatus[]).map((s) => ({
  label: ABSENCE_LABELS[s],
  value: s,
}));

// Reviewer view (`edit attendance`). Active employees only: inactive,
// onboarding and terminated employees are never counted as absent.
export function AbsenceReview() {
  const today = todayISTAsLocalDate();
  const [fromDate, setFromDate] = React.useState(() => format(startOfMonth(today), "yyyy-MM-dd"));
  const [toDate, setToDate] = React.useState(() => format(today, "yyyy-MM-dd"));
  const [status, setStatus] = React.useState<string>("absent");
  const [departmentId, setDepartmentId] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [departments, setDepartments] = React.useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeListItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<AbsenceAdminResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filter option sources are best-effort: a reviewer without view access to
  // departments/employees simply doesn't get that filter.
  React.useEffect(() => {
    departmentService.list().then(setDepartments).catch(() => setDepartments([]));
    employeeService
      .list({ limit: 100 })
      .then((r) => setEmployees(r.data))
      .catch(() => setEmployees([]));
  }, []);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(
        await absenceService.adminList({
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          status: (status as AbsenceStatus) || undefined,
          department_id: departmentId ? Number(departmentId) : undefined,
          employee_id: employeeId ? Number(employeeId) : undefined,
          page,
          per_page: 15,
        }),
      );
    } catch (err) {
      setError(parseApiError(err, "Failed to load absence records.").message);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate, status, departmentId, employeeId, page]);

  React.useEffect(() => {
    if (fromDate && toDate && toDate >= fromDate) load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load, fromDate, toDate]);

  const reset = () => setPage(1);
  const rows = data?.rows;

  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-6" aria-labelledby="absence-review-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="absence-review-title" className="text-lg font-semibold text-ink">
          Absence report
        </h2>
        <ExportMenu
          compact
          label="absence report"
          disabled={!fromDate || !toDate || toDate < fromDate}
          onExport={(format) =>
            downloadServerExport(
              "/attendance/absence/admin/export",
              { from_date: fromDate, to_date: toDate, status, department_id: departmentId, employee_id: employeeId },
              format,
              "absence",
            )
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          type="date"
          aria-label="Absence from date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            reset();
          }}
        />
        <Input
          type="date"
          aria-label="Absence to date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) => {
            setToDate(e.target.value);
            reset();
          }}
        />
        <Select
          aria-label="Filter by status"
          placeholder="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus((v as string) || "absent");
            reset();
          }}
        />
        {departments.length > 0 && (
          <Select
            aria-label="Filter by department"
            placeholder="All departments"
            options={departments.map((d) => ({ label: d.name, value: String(d.id) }))}
            value={departmentId}
            clearable
            onChange={(v) => {
              setDepartmentId((v as string) || "");
              reset();
            }}
          />
        )}
        {employees.length > 0 && (
          <Select
            aria-label="Filter by employee"
            placeholder="All employees"
            options={employees.map((e) => ({ label: `${e.name} (${e.employee_code})`, value: String(e.id) }))}
            value={employeeId}
            clearable
            onChange={(v) => {
              setEmployeeId((v as string) || "");
              reset();
            }}
          />
        )}
      </div>

      {toDate < fromDate && <InlineBanner type="error" message="To date cannot be before the from date." />}
      {error && <InlineBanner type="error" message={error} />}

      {data && (
        <p className="text-xs text-muted">
          {ABSENCE_LABELS.present}: {data.summary.present} · {ABSENCE_LABELS.absent}: {data.summary.absent} ·{" "}
          {ABSENCE_LABELS.leave}: {data.summary.leave} · {ABSENCE_LABELS.weekly_off}: {data.summary.weekly_off} · {ABSENCE_LABELS.holiday}: {data.summary.holiday}
          {" "}(employee-days in range, active employees)
        </p>
      )}

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-black/5" aria-hidden="true" />
      ) : rows && rows.data.length === 0 && !error ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted">
          No {ABSENCE_LABELS[(status as AbsenceStatus) || "absent"].toLowerCase()} records in this range.
        </p>
      ) : (
        rows && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">Employee absence records</caption>
              <thead className="bg-black/[0.03] text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Date</th>
                  <th scope="col" className="px-3 py-2 font-medium">Employee</th>
                  <th scope="col" className="px-3 py-2 font-medium">Department</th>
                  <th scope="col" className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.data.map((r) => (
                  <tr key={`${r.employee_id}-${r.date}`} className="border-t border-border/60">
                    <td className="px-3 py-2 text-ink">{formatDate(r.date)}</td>
                    <td className="px-3 py-2 text-ink">
                      {r.employee.name}
                      {r.employee.employee_code && <span className="ml-2 text-xs text-muted">{r.employee.employee_code}</span>}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{r.department ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <StatusPill status={ABSENCE_LABELS[r.status]} />
                        {r.pending_leave && <span className="text-xs text-muted">Leave pending</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {rows && rows.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button type="button" size="sm" variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-muted">
            Page {page} of {rows.last_page}
          </span>
          <Button type="button" size="sm" variant="outline" disabled={page >= rows.last_page || isLoading} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
