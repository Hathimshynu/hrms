"use client";

import {
  CalendarCheck,
  ClipboardList,
  FileClock,
  type LucideIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Skeleton } from "@/src/components/ui/skeleton";
import { useAuth } from "@/src/hooks/useAuth";
import { parseApiError } from "@/src/lib/api/errors";
import { attendanceService } from "@/src/lib/attendance/attendance.service";
import type { AttendanceSummaryResponse } from "@/src/lib/attendance/attendance.types";
import { regularizationService } from "@/src/lib/attendance/regularization.service";
import { employeeService } from "@/src/lib/employees/employee.service";
import { onboardingService } from "@/src/lib/employees/onboarding.service";

// Every figure on this page comes from an existing, verified endpoint.
// GET /api/dashboard is intentionally NOT used: it returns hardcoded
// literals server-side. Each widget loads independently, so a role without
// access to one source still sees the rest.

type State<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "denied" }
  | { status: "error"; message: string };

function useSource<T>(load: () => Promise<T>): State<T> {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setState({ status: "ready", data });
      })
      .catch((err) => {
        if (!active) return;
        const info = parseApiError(err, "Could not load this data.");
        setState(
          info.status === 403
            ? { status: "denied" }
            : { status: "error", message: info.message },
        );
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

function Stat<T>({
  label,
  icon: Icon,
  href,
  state,
  value,
  hint,
}: {
  label: string;
  icon: LucideIcon;
  href: string;
  state: State<T>;
  value: (data: T) => string | number;
  hint: string;
}) {
  const body =
    state.status === "loading" ? (
      <Skeleton className="mt-3 h-8 w-20" />
    ) : state.status === "ready" ? (
      <p className="mt-3 text-3xl font-bold text-ink tabular-nums">
        {value(state.data)}
      </p>
    ) : (
      <p className="mt-3 text-sm text-muted">
        {state.status === "denied"
          ? "Not available for your role"
          : "Unavailable right now"}
      </p>
    );

  const card = (
    <div className="h-full rounded-2xl border border-border bg-surface p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
          <Icon className="size-4" />
        </span>
      </div>
      {body}
      {state.status === "ready" && (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );

  return state.status === "ready" ? (
    <Link href={href} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-primary">
      {card}
    </Link>
  ) : (
    card
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-surface-muted/60 p-6 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-xs text-muted">{text}</p>
    </div>
  );
}

type AttendanceKey = Exclude<keyof AttendanceSummaryResponse, "date" | "total_records">;

const ATTENDANCE_ROWS: { key: AttendanceKey; label: string }[] = [
  { key: "present", label: "Present" },
  { key: "late", label: "Late" },
  { key: "half_day", label: "Half day" },
  { key: "on_leave", label: "On leave" },
  { key: "absent", label: "Absent" },
  { key: "holiday", label: "Holiday" },
  { key: "week_off", label: "Week off" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const employees = useSource(() => employeeService.list({ limit: 1 }));
  const attendance = useSource(() => attendanceService.summary());
  const pendingReg = useSource(() =>
    regularizationService.adminList({ status: "Pending", per_page: 1 }),
  );
  const drafts = useSource(() => onboardingService.listDrafts());

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Live figures from HATHIM HRMS. Sections outside your access are marked.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Employees"
          icon={Users}
          href="/people"
          state={employees}
          value={(d) => d.total}
          hint="Total employee records"
        />
        <Stat
          label="Present today"
          icon={CalendarCheck}
          href="/attendance"
          state={attendance}
          value={(d) => d.present}
          hint="Attendance marked present"
        />
        <Stat
          label="Pending regularizations"
          icon={FileClock}
          href="/attendance"
          state={pendingReg}
          value={(d) => d.total}
          hint="Awaiting review"
        />
        <Stat
          label="My onboarding drafts"
          icon={ClipboardList}
          href="/people/drafts"
          state={drafts}
          value={(d) => d.length}
          hint="In-progress drafts"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">Attendance today</h2>
          <div className="mt-4">
            {attendance.status === "loading" ? (
              <Skeleton className="h-40 w-full" />
            ) : attendance.status === "ready" ? (
              attendance.data.total_records === 0 ? (
                <EmptyPanel
                  title="No attendance recorded yet today"
                  text="Figures appear here once employees check in."
                />
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ATTENDANCE_ROWS.map((r) => (
                    <li key={r.key} className="rounded-xl bg-surface-muted px-3 py-3">
                      <p className="text-xs text-ink-soft">{r.label}</p>
                      <p className="mt-1 text-xl font-bold text-ink tabular-nums">
                        {attendance.data[r.key]}
                      </p>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <EmptyPanel
                title={
                  attendance.status === "denied"
                    ? "Not available for your role"
                    : "Attendance summary unavailable"
                }
                text={
                  attendance.status === "denied"
                    ? "The organisation-wide summary needs attendance management access."
                    : attendance.message
                }
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-ink">Insights</h2>
          <div className="mt-4">
            <EmptyPanel
              title="Payroll, leave, birthdays and activity"
              text="These insights will appear when the backend provides the data. Nothing is estimated here."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
