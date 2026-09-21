"use client";

import { addDays, format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import * as React from "react";

import { ExportMenu } from "@/src/components/common/ExportMenu";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDate, todayISTAsLocalDate } from "@/src/lib/date/format";
import { departmentService, type DepartmentDto } from "@/src/lib/departments/department.service";
import { employeeService, type EmployeeListItem } from "@/src/lib/employees/employee.service";
import { downloadServerExport } from "@/src/lib/export/download";
import { leaveService } from "@/src/lib/leave/leave.service";
import type { LeaveTypeOption } from "@/src/lib/leave/leave.types";
import { MONTH_OPTIONS, formatAmount } from "@/src/lib/payroll/payroll.service";
import {
  monthKeyLabel,
  pct,
  reportsService,
  type AttendanceReport,
  type DepartmentRow,
  type DepartmentsReport,
  type LeaveReport,
  type MonthlyReport,
  type PayrollReport,
  type ReportFilters,
  type ReportTab,
  type SummaryReport,
  type WorkforceReport,
} from "@/src/lib/reports/reports.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { ChartBlock, Column, DataGrid, Pager, SERIES, Section, Skeleton, StatCard } from "./components/ReportPanels";

const TABS: { id: ReportTab; label: string; payroll?: boolean }[] = [
  { id: "overview", label: "Overview" },
  { id: "workforce", label: "Workforce" },
  { id: "attendance", label: "Attendance" },
  { id: "absence", label: "Absence" },
  { id: "leave", label: "Leave" },
  { id: "payroll", label: "Payroll", payroll: true },
  { id: "departments", label: "Departments" },
  { id: "monthly", label: "Monthly summary" },
];

const DAY_TABS: ReportTab[] = ["overview", "attendance", "absence", "departments"]; // day-by-day, max 92 days
const DATE_TABS: ReportTab[] = ["overview", "workforce", "attendance", "absence", "leave", "departments"];
const EMPLOYEE_TABS: ReportTab[] = ["attendance", "absence", "leave", "payroll"];
const STATUS_OPTIONS: Partial<Record<ReportTab, { label: string; value: string }[]>> = {
  workforce: ["Active", "Inactive", "Onboarding", "Invited", "On Leave", "Terminated"].map((v) => ({ label: v, value: v })),
  attendance: [["present", "Present"], ["absent", "Absent"], ["leave", "Approved leave"], ["weekly_off", "Weekly off"], ["upcoming", "Upcoming"]].map(([value, label]) => ({ label, value })),
  absence: [["present", "Present"], ["absent", "Absent"], ["leave", "Approved leave"], ["weekly_off", "Weekly off"], ["upcoming", "Upcoming"]].map(([value, label]) => ({ label, value })),
  leave: ["pending", "approved", "rejected", "cancelled"].map((v) => ({ label: v[0].toUpperCase() + v.slice(1), value: v })),
  payroll: [{ label: "Draft", value: "draft" }, { label: "Processed", value: "processed" }],
};

const num = new Intl.NumberFormat("en-IN");
const n0 = (v: number) => num.format(v);
const money = (v: number) => formatAmount(v);

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status?: number;
}

function useReportData<T>(load: (signal: AbortSignal) => Promise<T>, enabled: boolean, deps: React.DependencyList): State<T> & { reload: () => void } {
  const [state, setState] = React.useState<State<T>>({ data: null, loading: enabled, error: null });
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null })); // eslint-disable-line react-hooks/set-state-in-effect
    load(controller.signal)
      .then((data) => !controller.signal.aborted && setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (controller.signal.aborted || (err as { code?: string })?.code === "ERR_CANCELED") return;
        const info = parseApiError(err, "Failed to load this report.");
        setState({ data: null, loading: false, error: info.message, status: info.status });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

export default function ReportsPage() {
  const { view: canView } = usePermission(MENU_MODULES.REPORTS);
  const { view: canExport } = usePermission(MENU_MODULES.REPORTS_EXPORT);
  const { view: canPayroll } = usePermission(MENU_MODULES.PAYROLL);

  const today = React.useMemo(() => todayISTAsLocalDate(), []);
  const [tab, setTab] = React.useState<ReportTab>("overview");
  const [fromDate, setFromDate] = React.useState(() => format(addDays(today, -29), "yyyy-MM-dd"));
  const [toDate, setToDate] = React.useState(() => format(today, "yyyy-MM-dd"));
  const [period, setPeriod] = React.useState(() => format(today, "yyyy-MM"));
  const [month, setMonth] = React.useState("");
  const [year, setYear] = React.useState(() => format(today, "yyyy"));
  const [departmentId, setDepartmentId] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [leaveType, setLeaveType] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<string | undefined>();
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const [departments, setDepartments] = React.useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeListItem[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeOption[]>([]);

  React.useEffect(() => {
    if (!canView) return;
    departmentService.list().then(setDepartments).catch(() => setDepartments([]));
    employeeService.list({ limit: 100 }).then((r) => setEmployees(r.data)).catch(() => setEmployees([]));
    leaveService.types().then(setLeaveTypes).catch(() => setLeaveTypes([]));
  }, [canView]);

  // --- filter validation (mirrors the backend limits) -----------------------
  const dateError = React.useMemo(() => {
    if (!DATE_TABS.includes(tab)) return null;
    if (!fromDate || !toDate) return "Choose both a from and a to date.";
    if (toDate < fromDate) return "To date cannot be before the from date.";
    const days = Math.round((Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000) + 1;
    const max = DAY_TABS.includes(tab) ? 92 : 731;
    if (days > max) return `This report supports at most ${max} days at a time.`;
    return null;
  }, [tab, fromDate, toDate]);
  const yearValid = /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 2100;
  const periodValid = /^\d{4}-\d{2}$/.test(period);
  const filterError = tab === "payroll" ? (year && !yearValid ? "Enter a valid 4-digit year." : null) : tab === "monthly" ? (periodValid ? null : "Choose a month.") : dateError;

  // Only send filters that apply to the current report.
  const filters = React.useMemo<ReportFilters>(() => {
    const f: ReportFilters = {};
    if (DATE_TABS.includes(tab)) Object.assign(f, { from_date: fromDate, to_date: toDate });
    if (tab === "monthly") f.period = period;
    if (tab === "payroll") Object.assign(f, { month: month ? Number(month) : undefined, year: year && yearValid ? Number(year) : undefined });
    if (departmentId) f.department_id = Number(departmentId);
    if (EMPLOYEE_TABS.includes(tab) && employeeId) f.employee_id = Number(employeeId);
    if (STATUS_OPTIONS[tab] && status) f.status = status;
    if (tab === "leave" && leaveType) f.leave_type = leaveType;
    return f;
  }, [tab, fromDate, toDate, period, month, year, yearValid, departmentId, employeeId, status, leaveType]);

  const paged = React.useMemo<ReportFilters>(() => ({ ...filters, page, per_page: 15, sort_by: sortBy, sort_dir: sortBy ? sortDir : undefined }), [filters, page, sortBy, sortDir]);
  const small = React.useMemo<ReportFilters>(() => ({ ...filters, per_page: 1 }), [filters]);
  const fkey = JSON.stringify(filters);
  const ok = canView && !filterError;

  // --- data ----------------------------------------------------------------
  const overview = useReportData(
    (signal) =>
      Promise.all([
        reportsService.summary(filters, signal),
        reportsService.attendance(small, signal),
        reportsService.leave(small, signal),
        reportsService.workforce(filters, signal),
        reportsService.departments(filters, signal),
        canPayroll ? reportsService.payroll({ year: Number(toDate.slice(0, 4)), department_id: filters.department_id, per_page: 1 }, signal) : Promise.resolve(null),
      ]).then(([summary, attendance, leave, workforce, depts, payroll]) => ({ summary, attendance, leave, workforce, depts, payroll })),
    ok && tab === "overview",
    [fkey, canPayroll, toDate],
  );
  const workforce = useReportData((s) => reportsService.workforce(filters, s), ok && tab === "workforce", [fkey]);
  const attendance = useReportData((s) => (tab === "absence" ? reportsService.absence(paged, s) : reportsService.attendance(paged, s)), ok && (tab === "attendance" || tab === "absence"), [fkey, page, sortBy, sortDir, tab]);
  const leave = useReportData((s) => reportsService.leave(paged, s), ok && tab === "leave", [fkey, page, sortBy, sortDir]);
  const payroll = useReportData((s) => reportsService.payroll(paged, s), ok && tab === "payroll" && canPayroll, [fkey, page, sortBy, sortDir, canPayroll]);
  const depts = useReportData((s) => reportsService.departments(filters, s), ok && tab === "departments", [fkey]);
  const monthly = useReportData((s) => reportsService.monthly(filters, s), ok && tab === "monthly", [fkey]);

  const active = { overview, workforce, attendance, absence: attendance, leave, payroll, departments: depts, monthly }[tab] as State<unknown> & { reload: () => void };

  const selectTab = (id: ReportTab) => {
    setTab(id);
    setStatus("");
    setPage(1);
    setSortBy(undefined);
  };
  const onSort = (key: string) => {
    setPage(1);
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "name" || key === "employee_code" ? "asc" : "desc");
    }
  };
  const onFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const visibleTabs = TABS.filter((t) => !t.payroll || canPayroll);

  if (!canView) {
    return (
      <div className="min-h-screen w-full bg-[#F2F2F2] px-3 py-6 sm:px-6 lg:px-8">
        <p role="status" className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-ink-soft">
          You don&apos;t have permission to view reports.
        </p>
      </div>
    );
  }

  const exportable: ReportTab = tab === "overview" ? "departments" : tab;

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2]">
      <div className="sticky top-0 z-40 bg-[#F2F2F2] px-3 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Go back" className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-light sm:text-2xl">Reports &amp; Analytics</h1>
              <p className="hidden text-xs text-ink-soft sm:block">HATHIM HRMS workforce, attendance, leave and payroll insights from live data.</p>
            </div>
          </div>
          {canExport && !filterError && (
            <ExportMenu
              label={`${TABS.find((t) => t.id === exportable)?.label ?? "report"} report`}
              onExport={(format) => downloadServerExport(`/reports/export/${exportable}`, filters as Record<string, string | number | undefined>, format, `report-${exportable}`)}
            />
          )}
        </div>
      </div>

      <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-4 px-3 py-4 sm:px-6 lg:px-8">
        <nav aria-label="Report type" className="overflow-x-auto">
          <div role="tablist" className="flex min-w-max gap-1 rounded-2xl border border-border bg-surface p-1">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="report-panel"
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => selectTab(t.id)}
                onKeyDown={(e) => {
                  const i = visibleTabs.findIndex((x) => x.id === tab);
                  if (e.key === "ArrowRight") selectTab(visibleTabs[(i + 1) % visibleTabs.length].id);
                  if (e.key === "ArrowLeft") selectTab(visibleTabs[(i - 1 + visibleTabs.length) % visibleTabs.length].id);
                }}
                className={`cursor-pointer whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 ${tab === t.id ? "bg-primary text-white" : "text-ink-soft hover:bg-surface-muted"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        <section aria-label="Report filters" className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DATE_TABS.includes(tab) && (
              <>
                <Input label="From date" type="date" value={fromDate} onChange={(e) => onFilter(() => setFromDate(e.target.value))} />
                <Input label="To date" type="date" value={toDate} min={fromDate || undefined} onChange={(e) => onFilter(() => setToDate(e.target.value))} />
              </>
            )}
            {tab === "monthly" && <Input label="Month" type="month" value={period} onChange={(e) => onFilter(() => setPeriod(e.target.value))} />}
            {tab === "payroll" && (
              <>
                <Select label="Month" placeholder="All months" options={MONTH_OPTIONS} value={month} clearable onChange={(v) => onFilter(() => setMonth((v as string) || ""))} />
                <Input label="Year" type="number" inputMode="numeric" min={2000} max={2100} value={year} onChange={(e) => onFilter(() => setYear(e.target.value))} />
              </>
            )}
            {departments.length > 0 && (
              <Select label="Department" placeholder="All departments" options={departments.map((d) => ({ label: d.name, value: String(d.id) }))} value={departmentId} clearable onChange={(v) => onFilter(() => setDepartmentId((v as string) || ""))} />
            )}
            {EMPLOYEE_TABS.includes(tab) && employees.length > 0 && (
              <Select label="Employee" placeholder="All employees" options={employees.map((e) => ({ label: `${e.name} (${e.employee_code})`, value: String(e.id) }))} value={employeeId} clearable onChange={(v) => onFilter(() => setEmployeeId((v as string) || ""))} />
            )}
            {STATUS_OPTIONS[tab] && (
              <Select label="Status" placeholder="All statuses" options={STATUS_OPTIONS[tab]} value={status} clearable onChange={(v) => onFilter(() => setStatus((v as string) || ""))} />
            )}
            {tab === "leave" && leaveTypes.length > 0 && (
              <Select label="Leave type" placeholder="All leave types" options={leaveTypes.map((t) => ({ label: t.name, value: t.code }))} value={leaveType} clearable onChange={(v) => onFilter(() => setLeaveType((v as string) || ""))} />
            )}
          </div>
          {filterError && <InlineBanner type="error" message={filterError} />}
        </section>

        <div id="report-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} aria-busy={active.loading} className="grid gap-4">
          {!filterError && active.error && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{active.status === 403 ? "You don't have access to this report." : active.error}</span>
              {active.status !== 403 && (
                <Button type="button" size="sm" variant="outline" onClick={active.reload}>
                  Retry
                </Button>
              )}
            </div>
          )}

          {!filterError && !active.error && active.loading && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-72" />
            </>
          )}

          {!filterError && !active.error && !active.loading && tab === "overview" && overview.data && <Overview d={overview.data} />}
          {!filterError && !active.error && !active.loading && tab === "workforce" && workforce.data && <Workforce d={workforce.data} />}
          {!filterError && !active.error && !active.loading && (tab === "attendance" || tab === "absence") && attendance.data && (
            <Attendance d={attendance.data} absence={tab === "absence"} page={page} onPage={setPage} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          )}
          {!filterError && !active.error && !active.loading && tab === "leave" && leave.data && <Leave d={leave.data} page={page} onPage={setPage} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />}
          {!filterError && !active.error && !active.loading && tab === "payroll" && payroll.data && <Payroll d={payroll.data} page={page} onPage={setPage} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />}
          {!filterError && !active.error && !active.loading && tab === "departments" && depts.data && <Departments d={depts.data} />}
          {!filterError && !active.error && !active.loading && tab === "monthly" && monthly.data && <Monthly d={monthly.data} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report bodies
// ---------------------------------------------------------------------------

const range = (from: string, to: string) => `${formatDate(from)} – ${formatDate(to)}`;

function Unavailable({ items }: { items: Record<string, string> | undefined }) {
  const list = Object.values(items ?? {});
  if (list.length === 0) return null;
  return (
    <div role="note" className="rounded-xl border border-border bg-surface px-4 py-3 text-xs text-ink-soft">
      <p className="font-semibold text-ink">Not available</p>
      <ul className="mt-1 list-disc pl-4">
        {list.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

const deptColumns = (payroll: boolean): Column<DepartmentRow>[] => [
  { key: "name", header: "Department", render: (r) => r.name },
  { key: "employees", header: "Employees", align: "right", render: (r) => n0(r.employees) },
  { key: "active", header: "Active", align: "right", render: (r) => n0(r.active_employees) },
  { key: "present", header: "Present days", align: "right", render: (r) => n0(r.present) },
  { key: "absent", header: "Absent days", align: "right", render: (r) => n0(r.absent) },
  { key: "pct", header: "Attendance", align: "right", render: (r) => pct(r.attendance_percentage) },
  { key: "leave", header: "Approved leave days", align: "right", render: (r) => n0(r.approved_leave_days) },
  ...(payroll
    ? ([
        { key: "gross", header: "Payroll gross", align: "right", render: (r) => money(r.payroll_gross ?? 0) },
        { key: "ded", header: "Deductions", align: "right", render: (r) => money(r.payroll_deductions ?? 0) },
        { key: "net", header: "Payroll net", align: "right", render: (r) => money(r.payroll_net ?? 0) },
      ] as Column<DepartmentRow>[])
    : []),
];

function DepartmentTable({ d, title = "Department analytics" }: { d: DepartmentsReport | { departments: DepartmentRow[]; includes_payroll: boolean; from_date: string; to_date: string }; title?: string }) {
  return (
    <Section title={title} description={`${range(d.from_date, d.to_date)} · attendance covers active employees; approved leave days are counted in the month the leave starts.`}>
      <DataGrid caption={title} columns={deptColumns(d.includes_payroll)} rows={d.departments} rowKey={(r) => r.id} emptyMessage="No departments to report." />
    </Section>
  );
}

function AttendanceCards({ s }: { s: AttendanceReport["summary"] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
      <StatCard label="Attendance rate" value={pct(s.attendance_percentage)} hint="present ÷ (present + absent)" />
      <StatCard label="Present days" value={n0(s.present)} />
      <StatCard label="Absent days" value={n0(s.absent)} hint={s.pending_leave_days ? `${n0(s.pending_leave_days)} with leave pending` : undefined} />
      <StatCard label="Approved leave days" value={n0(s.leave)} />
      <StatCard label="Weekly-off days" value={n0(s.weekly_off)} />
      <StatCard label="Upcoming days" value={n0(s.upcoming)} />
    </dl>
  );
}

function dailyData(d: AttendanceReport) {
  return d.daily.map((x) => ({ date: x.date, present: x.present, absent: x.absent, leave: x.leave, weekly_off: x.weekly_off, upcoming: x.upcoming }));
}

function Overview({ d }: { d: { summary: SummaryReport; attendance: AttendanceReport; leave: LeaveReport; workforce: WorkforceReport; depts: DepartmentsReport; payroll: PayrollReport | null } }) {
  const s = d.summary;
  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Summary">
        <StatCard label="Employees" value={n0(s.employees.employees)} hint={`${n0(s.employees.active)} active · ${n0(s.employees.joined_in_period)} joined in period`} />
        <StatCard label="Attendance rate" value={pct(s.attendance.attendance_percentage)} hint={`${n0(s.attendance.present)} present days`} />
        <StatCard label="Leave requests" value={n0(s.leave.total_requests)} hint={`${n0(s.leave.approved)} approved · ${n0(s.leave.approved_days)} days`} />
        <StatCard label="Absent days" value={n0(s.absence.absent)} hint={s.absence.pending_leave_days ? `${n0(s.absence.pending_leave_days)} with leave pending` : "no pending leave"} />
        {s.payroll ? <StatCard label="Net payroll" value={money(s.payroll.net_salary)} hint={`${n0(s.payroll.records)} records · gross ${money(s.payroll.gross_salary)}`} /> : <StatCard label="Payroll" value="Restricted" hint="Requires payroll access" />}
      </dl>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Daily attendance" description={range(d.attendance.from_date, d.attendance.to_date)}>
          <ChartBlock
            title="Daily attendance status"
            summary={`${n0(s.attendance.present)} present, ${n0(s.attendance.absent)} absent, ${n0(s.attendance.leave)} on approved leave, ${n0(s.attendance.weekly_off)} weekly off.`}
            data={dailyData(d.attendance)}
            xKey="date"
            xHeader="Date"
            formatX={(v) => formatDate(v)}
            series={[SERIES.present, SERIES.absent, SERIES.leave, SERIES.weekly_off, SERIES.upcoming]}
            stacked
            emptyMessage="No attendance data for these filters."
          />
        </Section>
        <Section title="Leave trend" description="Requests by the month the leave starts.">
          <ChartBlock
            title="Leave requests by month"
            summary={`${n0(s.leave.total_requests)} requests: ${n0(s.leave.pending)} pending, ${n0(s.leave.approved)} approved, ${n0(s.leave.rejected)} rejected, ${n0(s.leave.cancelled)} cancelled.`}
            data={d.leave.monthly}
            xKey="month"
            xHeader="Month"
            formatX={monthKeyLabel}
            series={[{ key: "approved", label: "Approved", color: "#10b981" }, { key: "pending", label: "Pending", color: "#f59e0b" }, { key: "rejected", label: "Rejected", color: "#ef4444" }, { key: "cancelled", label: "Cancelled", color: "#94a3b8" }]}
            emptyMessage="No leave requests in this period."
          />
        </Section>
        <Section title="Absence breakdown" description="Employee-days by status in the selected dates.">
          <ChartBlock
            title="Day status totals"
            summary={`Present ${n0(s.attendance.present)}, absent ${n0(s.attendance.absent)}, approved leave ${n0(s.attendance.leave)}, weekly off ${n0(s.attendance.weekly_off)}, upcoming ${n0(s.attendance.upcoming)}.`}
            data={[{ status: "Present", days: s.attendance.present }, { status: "Absent", days: s.attendance.absent }, { status: "Approved leave", days: s.attendance.leave }, { status: "Weekly off", days: s.attendance.weekly_off }, { status: "Upcoming", days: s.attendance.upcoming }]}
            xKey="status"
            xHeader="Status"
            series={[{ key: "days", label: "Employee-days", color: "#4f6ef7" }]}
            horizontal
            height={240}
            emptyMessage="No attendance data for these filters."
          />
        </Section>
        <Section title="Headcount by department">
          <ChartBlock
            title="Employees by department"
            summary={d.workforce.by_department.map((x) => `${x.name} ${x.total}`).join(", ") || "No departments."}
            data={d.workforce.by_department.map((x) => ({ name: x.name, total: x.total, active: x.active }))}
            xKey="name"
            xHeader="Department"
            series={[{ key: "total", label: "All employees", color: "#94a3b8" }, { key: "active", label: "Active", color: "#4f6ef7" }]}
            horizontal
            height={240}
            emptyMessage="No employees to report."
          />
        </Section>
        {d.payroll && (
          <Section title="Payroll by month" description="Stored payroll records (all statuses).">
            <ChartBlock
              title="Payroll by month"
              summary={d.payroll.by_month.map((m) => `${monthKeyLabel(m.label)} net ${money(m.net_salary)}`).join(", ") || "No payroll records."}
              data={d.payroll.by_month.map((m) => ({ label: m.label, gross: m.gross_salary, deductions: m.total_deductions, net: m.net_salary }))}
              xKey="label"
              xHeader="Month"
              formatX={monthKeyLabel}
              formatValue={money}
              series={[{ key: "gross", label: "Gross", color: "#4f6ef7" }, { key: "deductions", label: "Deductions", color: "#f59e0b" }, { key: "net", label: "Net", color: "#10b981" }]}
              emptyMessage="No payroll records for this year."
            />
          </Section>
        )}
      </div>

      <DepartmentTable d={d.depts} />
      <Unavailable items={s.unavailable} />
    </>
  );
}

function Workforce({ d }: { d: WorkforceReport }) {
  const rows = (title: string, data: { label: string; total: number; active?: number }[]) => (
    <Section title={title}>
      <DataGrid
        caption={title}
        columns={[
          { key: "label", header: "Group", render: (r) => r.label },
          { key: "total", header: "Employees", align: "right", render: (r) => n0(r.total) },
          ...(data.some((r) => r.active !== undefined) ? ([{ key: "active", header: "Active", align: "right", render: (r) => n0(r.active ?? 0) }] as Column<{ label: string; total: number; active?: number }>[]) : []),
        ]}
        rows={data}
        rowKey={(r) => r.label}
        emptyMessage="No employees match these filters."
      />
    </Section>
  );

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total employees" value={n0(d.totals.employees)} />
        <StatCard label="Active" value={n0(d.totals.active)} />
        <StatCard label="Not active" value={n0(d.totals.inactive)} />
        <StatCard label="Joined in period" value={n0(d.totals.joined_in_period)} hint={range(d.from_date, d.to_date)} />
      </dl>
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Headcount by department">
          <ChartBlock title="Employees by department" summary={d.by_department.map((x) => `${x.name} ${x.total}`).join(", ")} data={d.by_department.map((x) => ({ name: x.name, total: x.total, active: x.active }))} xKey="name" xHeader="Department" series={[{ key: "total", label: "All employees", color: "#94a3b8" }, { key: "active", label: "Active", color: "#4f6ef7" }]} horizontal height={260} emptyMessage="No employees to report." />
        </Section>
        <Section title="Joining trend" description="New joiners by joining month.">
          <ChartBlock title="Joiners by month" summary={d.joining_trend.filter((t) => t.joiners > 0).map((t) => `${monthKeyLabel(t.month)} ${t.joiners}`).join(", ") || "No joiners."} data={d.joining_trend} xKey="month" xHeader="Month" formatX={monthKeyLabel} series={[{ key: "joiners", label: "Joiners", color: "#10b981" }]} emptyMessage="No joiners in this period." />
        </Section>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {rows("By employment status", d.by_status)}
        {rows("By designation", d.by_designation)}
        {rows("By gender", d.by_gender)}
        {rows("By employment type", d.by_employment_type)}
      </div>
      <Unavailable items={d.unavailable} />
    </>
  );
}

interface Sortable {
  page: number;
  onPage: (p: number) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort: (k: string) => void;
}

function Attendance({ d, absence, ...t }: { d: AttendanceReport; absence: boolean } & Sortable) {
  const cols: Column<AttendanceReport["employees"]["data"][number]>[] = [
    { key: "code", header: "Code", sortKey: "employee_code", render: (r) => r.employee_code ?? "—" },
    { key: "name", header: "Employee", sortKey: "name", render: (r) => r.name },
    { key: "dept", header: "Department", sortKey: "department", render: (r) => r.department ?? "—" },
    { key: "present", header: "Present", sortKey: "present", align: "right", render: (r) => n0(r.present) },
    { key: "absent", header: "Absent", sortKey: "absent", align: "right", render: (r) => n0(r.absent) },
    { key: "leave", header: "Approved leave", sortKey: "leave", align: "right", render: (r) => n0(r.leave) },
    { key: "wo", header: "Week off", sortKey: "weekly_off", align: "right", render: (r) => n0(r.weekly_off) },
    { key: "pl", header: "Leave pending", sortKey: "pending_leave_days", align: "right", render: (r) => (r.pending_leave_days ? `${r.pending_leave_days} day(s)` : "—") },
    { key: "pct", header: "Attendance", sortKey: "attendance_percentage", align: "right", render: (r) => pct(r.attendance_percentage) },
  ];
  return (
    <>
      <AttendanceCards s={d.summary} />
      {!absence && (
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard label="Late days" value={n0(d.summary.late_days)} hint="attendance marked Late" />
          <StatCard label="Half days" value={n0(d.summary.half_days)} />
          <StatCard label="Regularizations pending" value={n0(d.regularizations.pending)} />
          <StatCard label="Regularizations approved" value={n0(d.regularizations.approved)} />
          <StatCard label="Regularizations rejected" value={n0(d.regularizations.rejected)} />
          <StatCard label="Employees covered" value={n0(d.summary.employees)} hint="active employees" />
        </dl>
      )}
      <Section title={absence ? "Daily absence trend" : "Daily attendance trend"} description={range(d.from_date, d.to_date)}>
        <ChartBlock
          title="Daily status"
          summary={`${n0(d.summary.present)} present, ${n0(d.summary.absent)} absent, ${n0(d.summary.leave)} approved leave, ${n0(d.summary.weekly_off)} weekly off.`}
          data={dailyData(d)}
          xKey="date"
          xHeader="Date"
          formatX={(v) => formatDate(v)}
          series={[SERIES.present, SERIES.absent, SERIES.leave, SERIES.weekly_off, SERIES.upcoming]}
          stacked
          emptyMessage="No attendance data for these filters."
        />
      </Section>
      <Section title="Department summary">
        <DataGrid
          caption="Attendance by department"
          columns={[
            { key: "name", header: "Department", render: (r: AttendanceReport["by_department"][number]) => r.name },
            { key: "present", header: "Present", align: "right", render: (r) => n0(r.present) },
            { key: "absent", header: "Absent", align: "right", render: (r) => n0(r.absent) },
            { key: "leave", header: "Approved leave", align: "right", render: (r) => n0(r.leave) },
            { key: "wo", header: "Week off", align: "right", render: (r) => n0(r.weekly_off) },
            { key: "pct", header: "Attendance", align: "right", render: (r) => pct(r.attendance_percentage) },
          ]}
          rows={d.by_department}
          rowKey={(r) => r.name}
        />
      </Section>
      <Section title={absence ? "Employee absence" : "Employee attendance"} description={`${n0(d.employees.total)} employee(s). Sorted ${t.sortBy ?? (absence ? "by most absent days" : "by name")}.`}>
        <DataGrid caption="Employee summary" columns={cols} rows={d.employees.data} rowKey={(r) => r.employee_id} sortBy={t.sortBy ?? (absence ? "absent" : "name")} sortDir={t.sortBy ? t.sortDir : absence ? "desc" : "asc"} onSort={t.onSort} />
        <Pager page={t.page} lastPage={d.employees.last_page} onPage={t.onPage} />
      </Section>
      <Unavailable items={d.unavailable} />
    </>
  );
}

function Leave({ d, ...t }: { d: LeaveReport } & Sortable) {
  const s = d.summary;
  const cols: Column<LeaveReport["employees"]["data"][number]>[] = [
    { key: "code", header: "Code", sortKey: "employee_code", render: (r) => r.employee_code ?? "—" },
    { key: "name", header: "Employee", sortKey: "name", render: (r) => r.name },
    { key: "dept", header: "Department", render: (r) => r.department ?? "—" },
    { key: "total", header: "Requests", sortKey: "total", align: "right", render: (r) => n0(r.total) },
    { key: "pending", header: "Pending", sortKey: "pending", align: "right", render: (r) => n0(r.pending) },
    { key: "approved", header: "Approved", sortKey: "approved", align: "right", render: (r) => n0(r.approved) },
    { key: "rejected", header: "Rejected", sortKey: "rejected", align: "right", render: (r) => n0(r.rejected) },
    { key: "cancelled", header: "Cancelled", sortKey: "cancelled", align: "right", render: (r) => n0(r.cancelled) },
    { key: "days", header: "Approved days", sortKey: "approved_days", align: "right", render: (r) => n0(r.approved_days) },
  ];
  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Total requests" value={n0(s.total_requests)} />
        <StatCard label="Pending" value={n0(s.pending)} />
        <StatCard label="Approved" value={n0(s.approved)} />
        <StatCard label="Rejected" value={n0(s.rejected)} />
        <StatCard label="Cancelled" value={n0(s.cancelled)} />
        <StatCard label="Approved leave days" value={n0(s.approved_days)} />
      </dl>
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Monthly leave trend" description={d.note}>
          <ChartBlock title="Leave requests by month" summary={`${n0(s.total_requests)} requests in ${range(d.from_date, d.to_date)}.`} data={d.monthly} xKey="month" xHeader="Month" formatX={monthKeyLabel} series={[{ key: "approved", label: "Approved", color: "#10b981" }, { key: "pending", label: "Pending", color: "#f59e0b" }, { key: "rejected", label: "Rejected", color: "#ef4444" }, { key: "cancelled", label: "Cancelled", color: "#94a3b8" }]} emptyMessage="No leave requests in this period." />
        </Section>
        <Section title="Leave by type" description="Leave type is the leave policy the request was made against.">
          <ChartBlock title="Requests by leave type" summary={d.by_type.map((x) => `${x.name} ${x.total}`).join(", ") || "No requests."} data={d.by_type.map((x) => ({ name: x.name, total: x.total, approved: x.approved }))} xKey="name" xHeader="Leave type" series={[{ key: "total", label: "All requests", color: "#94a3b8" }, { key: "approved", label: "Approved", color: "#10b981" }]} horizontal height={240} emptyMessage="No leave requests in this period." />
        </Section>
      </div>
      <Section title="Leave by department">
        <DataGrid
          caption="Leave by department"
          columns={[
            { key: "name", header: "Department", render: (r: LeaveReport["by_department"][number]) => r.name },
            { key: "total", header: "Requests", align: "right", render: (r) => n0(r.total) },
            { key: "approved", header: "Approved", align: "right", render: (r) => n0(r.approved) },
            { key: "days", header: "Approved days", align: "right", render: (r) => n0(r.approved_days) },
          ]}
          rows={d.by_department}
          rowKey={(r) => r.name}
          emptyMessage="No leave requests in this period."
        />
      </Section>
      <Section title="Employee leave summary" description={`${n0(d.employees.total)} employee(s) with requests.`}>
        <DataGrid caption="Employee leave summary" columns={cols} rows={d.employees.data} rowKey={(r) => r.employee_id} sortBy={t.sortBy ?? "approved_days"} sortDir={t.sortBy ? t.sortDir : "desc"} onSort={t.onSort} emptyMessage="No leave requests match these filters." />
        <Pager page={t.page} lastPage={d.employees.last_page} onPage={t.onPage} />
      </Section>
      <Unavailable items={d.unavailable} />
    </>
  );
}

function Payroll({ d, ...t }: { d: PayrollReport } & Sortable) {
  const cols: Column<PayrollReport["employees"]["data"][number]>[] = [
    { key: "code", header: "Code", sortKey: "employee_code", render: (r) => r.employee_code ?? "—" },
    { key: "name", header: "Employee", sortKey: "name", render: (r) => r.name },
    { key: "dept", header: "Department", render: (r) => r.department ?? "—" },
    { key: "records", header: "Records", sortKey: "records", align: "right", render: (r) => n0(r.records) },
    { key: "basic", header: "Basic", sortKey: "basic", align: "right", render: (r) => money(r.basic_salary) },
    { key: "gross", header: "Gross", sortKey: "gross", align: "right", render: (r) => money(r.gross_salary) },
    { key: "ded", header: "Deductions", sortKey: "deductions", align: "right", render: (r) => money(r.total_deductions) },
    { key: "net", header: "Net", sortKey: "net", align: "right", render: (r) => money(r.net_salary) },
  ];
  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Payroll records" value={n0(d.totals.records)} />
        <StatCard label="Basic salary" value={money(d.totals.basic_salary)} />
        <StatCard label="Gross payroll" value={money(d.totals.gross_salary)} />
        <StatCard label="Total deductions" value={money(d.totals.total_deductions)} />
        <StatCard label="Net payroll" value={money(d.totals.net_salary)} />
      </dl>
      <Section title="Payroll by month" description={d.note}>
        <ChartBlock title="Payroll by month" summary={d.by_month.map((m) => `${monthKeyLabel(m.label)} net ${money(m.net_salary)}`).join(", ") || "No payroll records."} data={d.by_month.map((m) => ({ label: m.label, gross: m.gross_salary, deductions: m.total_deductions, net: m.net_salary }))} xKey="label" xHeader="Month" formatX={monthKeyLabel} formatValue={money} series={[{ key: "gross", label: "Gross", color: "#4f6ef7" }, { key: "deductions", label: "Deductions", color: "#f59e0b" }, { key: "net", label: "Net", color: "#10b981" }]} emptyMessage="No payroll records match these filters." />
      </Section>
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Status summary">
          <DataGrid caption="Payroll by status" columns={[{ key: "s", header: "Status", render: (r: PayrollReport["by_status"][number]) => r.status[0].toUpperCase() + r.status.slice(1) }, { key: "n", header: "Records", align: "right", render: (r) => n0(r.records) }, { key: "g", header: "Gross", align: "right", render: (r) => money(r.gross_salary) }, { key: "net", header: "Net", align: "right", render: (r) => money(r.net_salary) }]} rows={d.by_status} rowKey={(r) => r.status} emptyMessage="No payroll records match these filters." />
        </Section>
        <Section title="Payroll by department">
          <DataGrid caption="Payroll by department" columns={[{ key: "n", header: "Department", render: (r: PayrollReport["by_department"][number]) => r.name }, { key: "r", header: "Records", align: "right", render: (r) => n0(r.records) }, { key: "g", header: "Gross", align: "right", render: (r) => money(r.gross_salary) }, { key: "d", header: "Deductions", align: "right", render: (r) => money(r.total_deductions) }, { key: "net", header: "Net", align: "right", render: (r) => money(r.net_salary) }]} rows={d.by_department} rowKey={(r) => r.name} emptyMessage="No payroll records match these filters." />
        </Section>
      </div>
      <Section title="Employee payroll summary" description={`${n0(d.employees.total)} employee(s). Bank details are never included.`}>
        <DataGrid caption="Employee payroll summary" columns={cols} rows={d.employees.data} rowKey={(r) => r.employee_id} sortBy={t.sortBy ?? "net"} sortDir={t.sortBy ? t.sortDir : "desc"} onSort={t.onSort} emptyMessage="No payroll records match these filters." />
        <Pager page={t.page} lastPage={d.employees.last_page} onPage={t.onPage} />
      </Section>
    </>
  );
}

function Departments({ d }: { d: DepartmentsReport }) {
  return (
    <>
      <DepartmentTable d={d} title="Department HR analytics" />
      <Section title="Attendance rate by department">
        <ChartBlock title="Attendance rate by department" summary={d.departments.map((x) => `${x.name} ${pct(x.attendance_percentage)}`).join(", ")} data={d.departments.map((x) => ({ name: x.name, rate: x.attendance_percentage ?? 0 }))} xKey="name" xHeader="Department" series={[{ key: "rate", label: "Attendance %", color: "#4f6ef7" }]} horizontal height={240} formatValue={(v) => `${v}%`} emptyMessage="No attendance data for these filters." />
      </Section>
    </>
  );
}

function Monthly({ d }: { d: MonthlyReport }) {
  return (
    <>
      <Section title={`HR summary — ${monthKeyLabel(d.period)}`} description={range(d.from_date, d.to_date)}>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Active employees" value={n0(d.workforce.active_employees)} hint="active and joined by month end" />
          <StatCard label="New joiners" value={n0(d.workforce.new_joiners)} />
          <StatCard label="Opening workforce" value="Not available" hint="no exit/status history is stored" />
          <StatCard label="Attendance rate" value={pct(d.attendance.attendance_percentage)} />
          <StatCard label="Present days" value={n0(d.attendance.present)} />
          <StatCard label="Absent days" value={n0(d.attendance.absent)} />
          <StatCard label="Approved leave days" value={n0(d.leave.approved_days)} hint={`${n0(d.leave.total_requests)} requests`} />
          {d.payroll ? <StatCard label="Net payroll" value={money(d.payroll.net_salary)} hint={`${n0(d.payroll.records)} records`} /> : <StatCard label="Payroll" value="Restricted" hint="Requires payroll access" />}
        </dl>
      </Section>
      <DepartmentTable d={{ departments: d.departments, includes_payroll: d.includes_payroll, from_date: d.from_date, to_date: d.to_date }} title="Department summary" />
      <Unavailable items={d.unavailable} />
    </>
  );
}

