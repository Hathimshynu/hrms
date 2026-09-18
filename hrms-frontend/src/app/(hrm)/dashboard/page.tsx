"use client";

import { motion, type Variants } from "framer-motion";
import {
  Cake,
  FileText,
  Folder,
  IdCard,
  type LucideIcon,
  Upload,
  UserPen,
} from "lucide-react";
import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";

import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "next/navigation";

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

function ThemeCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={`flex h-full flex-col gap-0 rounded-2xl border border-border/20 bg-surface py-0 ${className}`}
    >
      {children}
    </Card>
  );
}

function Badge({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

const primaryStats = [
  {
    label: "Total Employees",
    value: 22,
    icon: Folder,
    trend: { text: "12%", tone: "up" as const, caption: "vs last month" },
  },
  {
    label: "Active Employees",
    value: 17,
    icon: IdCard,
    badge: { text: "77% of total", tone: "neutral" as const },
  },
  {
    label: "Invited Employees",
    value: 2,
    icon: FileText,
    badge: { text: "Awaiting Onboarding", tone: "info" as const },
  },
];

const secondaryStats = [
  {
    label: "Present Today",
    value: 22,
    icon: Folder,
    trend: { text: "12%", tone: "up" as const, caption: "vs last month" },
  },
  {
    label: "Employees on Leave",
    value: 3,
    icon: UserPen,
    badge: { text: "Planned Leave", tone: "neutral" as const },
  },
  {
    label: "Pending Leave Requests",
    value: 2,
    icon: FileText,
    badge: { text: "Needs Review", tone: "warning" as const },
  },
];

const attendanceData = [
  { key: "present", label: "Present", value: 60, fill: "var(--color-present)" },
  { key: "absent", label: "Absent", value: 25, fill: "var(--color-absent)" },
  { key: "late", label: "Late", value: 15, fill: "var(--color-late)" },
  {
    key: "leavePlanned",
    label: "Leave Applied",
    value: 15,
    fill: "var(--color-leavePlanned)",
  },
  {
    key: "leaveOther",
    label: "Leave",
    value: 15,
    fill: "var(--color-leaveOther)",
  },
];

const attendanceChartConfig = {
  present: { label: "Present", color: "#16A34A" },
  absent: { label: "Absent", color: "#DC2626" },
  late: { label: "Late", color: "#D97706" },
  leavePlanned: { label: "Leave", color: "#0E7C7B" },
  leaveOther: { label: "Leave", color: "#94D9D7" },
} satisfies ChartConfig;

const allBirthdays = [
  {
    initials: "AR",
    name: "Arjun Raj",
    dept: "Engineering",
    month: 8,
    day: 24,
  },
  {
    initials: "NS",
    name: "Neha Singh",
    dept: "Marketing",
    month: 8,
    day: 27,
  },
  {
    initials: "VK",
    name: "Vikram Kumar",
    dept: "Finance",
    month: 8,
    day: 29,
  },
  {
    initials: "AM",
    name: "Ananya Menon",
    dept: "Design",
    month: 8,
    day: 29,
  },
  {
    initials: "RS",
    name: "Rahul Shah",
    dept: "Sales",
    month: 8,
    day: 30,
  },
  {
    initials: "DK",
    name: "Divya Krishnan",
    dept: "Human Resources",
    month: 8,
    day: 31,
  },
  {
    initials: "SJ",
    name: "Sanjay Joseph",
    dept: "Operations",
    month: 9,
    day: 1,
  },
  {
    initials: "PM",
    name: "Pooja Mehta",
    dept: "Finance",
    month: 9,
    day: 4,
  },
  {
    initials: "AV",
    name: "Aditya Verma",
    dept: "Engineering",
    month: 9,
    day: 7,
  },
  {
    initials: "SR",
    name: "Sneha Rao",
    dept: "Marketing",
    month: 9,
    day: 12,
  },
  {
    initials: "KM",
    name: "Karthik Mohan",
    dept: "Product",
    month: 9,
    day: 15,
  },
];

const pendingApprovals = [
  { initials: "AD", name: "Ananya Desai", day: "Wednesday" },
  { initials: "YD", name: "Yash Desai", day: "Wednesday" },
  { initials: "IC", name: "Ishita Chatterjee", day: "Wednesday" },
  { initials: "PK", name: "Priya kapoor", day: "Wednesday" },
];

const recentActivities = [
  { text: "Leave Request approved for Priya sharma", time: "12 min ago" },
  { text: "Pooja Kappor invited to join engineering", time: "12 min ago" },
  { text: "August payroll procession started", time: "12 min ago" },
  { text: "Pooja Iyer updated bank details", time: "12 min ago" },
  { text: "Leave Request approved for divya sharma", time: "12 min ago" },
];

const PAYROLL_PROCESSED = 14;
const PAYROLL_TOTAL = 20;

const DEFAULT_COUNTUP_DURATION = 1800;

function useCountUp(value: number, duration = DEFAULT_COUNTUP_DURATION) {
  const [display, setDisplay] = React.useState(0);
  const startRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let raf = 0;
    startRef.current = null;

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

function CountUp({
  value,
  duration,
  formatter,
}: {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
}) {
  const animated = useCountUp(value, duration);
  return <>{formatter ? formatter(animated) : animated}</>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  badge,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: { text: string; tone: "up" | "down"; caption: string };
  badge?: { text: string; tone: "neutral" | "info" | "warning" };
}) {
  const badgeClass =
    badge?.tone === "info"
      ? "bg-primary-soft text-primary"
      : badge?.tone === "warning"
        ? "bg-amber-50 text-amber-600"
        : "bg-surface-muted text-ink-soft border border-border";

  return (
    <ThemeCard>
      <CardContent className="flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
          {trend && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              ↗ {trend.text}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-1 items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              <CountUp value={value} />
            </p>
            <p className="mt-0.5 truncate text-sm text-ink-soft">{label}</p>
          </div>
          {trend ? (
            <span className="shrink-0 pb-1 text-[11px] text-muted">
              {trend.caption}
            </span>
          ) : badge ? (
            <Badge className={`shrink-0 border-0 font-medium ${badgeClass}`}>
              {badge.text}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </ThemeCard>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
      {initials}
    </span>
  );
}

function getWeekRange(base: Date) {
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // back up to Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    base.getFullYear(),
    base.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

function nextOccurrence(month: number, day: number, referenceYear: number) {
  return new Date(referenceYear, month - 1, day);
}

function isTodayBirthday(month: number, day: number, today: Date) {
  return today.getMonth() + 1 === month && today.getDate() === day;
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "long" });

type BirthdayRange = "week" | "month";

function getBirthdaysInRange(
  list: typeof allBirthdays,
  range: BirthdayRange,
  today: Date = new Date(),
) {
  const { start, end } =
    range === "week" ? getWeekRange(today) : getMonthRange(today);

  return list
    .map((person) => {
      let occurrence = nextOccurrence(
        person.month,
        person.day,
        start.getFullYear(),
      );
      // handle a range that straddles a year boundary (e.g. week: Dec 29 - Jan 4)
      if (occurrence < start) {
        occurrence = nextOccurrence(
          person.month,
          person.day,
          start.getFullYear() + 1,
        );
      }
      return { ...person, occurrence };
    })
    .filter(({ occurrence }) => occurrence >= start && occurrence <= end)
    .sort((a, b) => a.occurrence.getTime() - b.occurrence.getTime())
    .map((p) => ({
      ...p,
      weekday: WEEKDAY_FORMATTER.format(p.occurrence),
      isToday: isTodayBirthday(p.month, p.day, today),
    }));
}

function BirthdayCard() {
  const [range, setRange] = React.useState<BirthdayRange>("week");

  const birthdays = React.useMemo(
    () => getBirthdaysInRange(allBirthdays, range),
    [range],
  );

  return (
    <ThemeCard className="overflow-hidden">
      <CardHeader className="flex-col items-stretch gap-3 space-y-0 border-b border-border/60 bg-linear-to-r from-primary-soft/70 to-primary-soft/20 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <Cake className="h-4.5 w-4.5" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold text-ink">
                Birthdays
              </CardTitle>
              <p className="text-xs text-ink-soft">
                {range === "week" ? "This week" : "This month"}
              </p>
            </div>
          </div>
          <Badge className="border-0 bg-white font-semibold text-primary shadow-sm">
            {birthdays.length} {range === "week" ? "this week" : "this month"}
          </Badge>
        </div>

        {/* Range toggle */}
        <div className="flex w-fit gap-1 rounded-lg bg-white/70 p-1">
          <button
            type="button"
            onClick={() => setRange("week")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              range === "week"
                ? "bg-primary text-white shadow-sm"
                : "text-ink-soft hover:bg-white"
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setRange("month")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              range === "month"
                ? "bg-primary text-white shadow-sm"
                : "text-ink-soft hover:bg-white"
            }`}
          >
            This Month
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
        {birthdays.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <Cake className="h-8 w-8 text-muted" />
            <p className="text-sm text-ink-soft">
              No birthdays {range === "week" ? "this week" : "this month"}
            </p>
          </div>
        ) : (
          <div className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
            {birthdays.map((b, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors ${
                  b.isToday
                    ? "bg-primary-soft/60 ring-1 ring-primary/30"
                    : "hover:bg-surface-muted"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    b.isToday
                      ? "bg-primary text-white"
                      : "bg-primary-soft text-primary"
                  }`}
                >
                  {b.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {b.name}
                  </p>
                  <p className="truncate text-xs text-muted">{b.dept}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {b.isToday ? (
                    <Badge className="border-0 bg-primary font-medium text-white">
                      🎉 Today
                    </Badge>
                  ) : (
                    <span className="text-xs font-medium text-ink-soft">
                      {b.weekday}
                    </span>
                  )}
                  <span className="text-[11px] text-muted">
                    {b.occurrence.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </ThemeCard>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const today = React.useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const firstName = user?.name?.split(" ")[0] ?? (isLoading ? "" : "there");

  const payrollPct = Math.round((PAYROLL_PROCESSED / PAYROLL_TOTAL) * 100);

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-[1600px] flex-col"
      >
        {/* Header */}
        <motion.div
          variants={fadeUp}
          className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink sm:text-2xl">
              Good morning{firstName ? `, ${firstName}` : ""}
            </h1>
          </div>
          <div className="flex sm:w-auto sm:shrink-0">
            <button
              onClick={() => {}}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#FF7F50] px-4 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-[#E97451] sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </motion.div>

        <div className="mb-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {primaryStats.map((s) => (
                <motion.div key={s.label} variants={fadeUp}>
                  <StatCard {...s} />
                </motion.div>
              ))}
              {secondaryStats.map((s) => (
                <motion.div key={s.label} variants={fadeUp}>
                  <StatCard {...s} />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div variants={fadeUp} className="lg:col-span-4">
            <BirthdayCard />
          </motion.div>
        </div>

        <div className="mb-4 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
          <motion.div variants={fadeUp}>
            <ThemeCard>
              <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
                <CardTitle className="text-base font-semibold text-ink">
                  Attendance Overview - Today
                </CardTitle>
                <Badge className="border-0 bg-amber-50 font-medium text-amber-600">
                  ● Live
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center">
                  <ChartContainer
                    config={attendanceChartConfig}
                    className="mx-auto aspect-square h-42.5 w-42.5 shrink-0 overflow-visible sm:h-47.5 sm:w-47.5"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={attendanceData}
                        dataKey="value"
                        nameKey="label"
                        innerRadius="62%"
                        outerRadius="90%"
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {attendanceData.map((entry) => (
                          <Cell key={entry.key} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>

                  <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
                    {attendanceData.map((d, i) => (
                      <div
                        key={`${d.key}-${i}`}
                        className="rounded-lg bg-surface-muted px-3 py-2.5"
                      >
                        <span
                          className="mb-1.5 inline-block h-2 w-2 rounded-full align-middle"
                          style={{
                            backgroundColor:
                              attendanceChartConfig[
                                d.key as keyof typeof attendanceChartConfig
                              ].color,
                          }}
                        />
                        <span className="ml-1.5 text-xs text-ink-soft">
                          {d.label}
                        </span>
                        <p className="mt-0.5 text-lg font-bold text-ink">
                          <CountUp value={d.value} />%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </ThemeCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ThemeCard>
              <CardHeader className="px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
                <CardTitle className="text-base font-semibold text-ink">
                  Monthly Payroll
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-4 pt-2 pb-4 sm:px-5 sm:pb-5">
                <p className="text-2xl font-bold text-primary sm:text-3xl">
                  {"\u20B9"}
                  <CountUp
                    value={1629800}
                    duration={2200}
                    formatter={(n) => n.toLocaleString("en-IN")}
                  />
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Net payroll this cycle
                </p>

                <div className="mt-6 mb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">Processed</span>
                    <span className="font-medium text-ink">
                      <CountUp value={PAYROLL_PROCESSED} />/{PAYROLL_TOTAL}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${payrollPct}%` }}
                      transition={{
                        duration: 0.9,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.3,
                      }}
                    />
                  </div>
                </div>

                <Button
                  className="mt-auto w-full bg-primary text-white hover:bg-primary-dark"
                  onClick={() => router.push("/salary")}
                >
                  View payroll
                </Button>
              </CardContent>
            </ThemeCard>
          </motion.div>
        </div>

        <div className="grid flex-1 grid-cols-1 items-stretch gap-4 md:grid-cols-2">
          <motion.div variants={fadeUp}>
            <ThemeCard>
              <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
                <CardTitle className="text-base font-semibold text-ink">
                  Pending Approvals
                </CardTitle>
                <Badge className="border-0 bg-primary-soft font-medium text-primary">
                  Total : <CountUp value={pendingApprovals.length} />
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col divide-y divide-border px-4 pt-2 pb-4 sm:px-5 sm:pb-5">
                {pendingApprovals.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Avatar initials={p.initials} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted">{p.day}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </ThemeCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ThemeCard>
              <CardHeader className="px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
                <CardTitle className="text-base font-semibold text-ink">
                  Recent Employee Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-4 pt-2 pb-4 sm:px-5 sm:pb-5">
                <ol className="relative ml-1.5 flex flex-1 flex-col justify-between border-l-2 border-primary-soft">
                  {recentActivities.map((a, i) => (
                    <li key={i} className="mb-5 ml-5 last:mb-0">
                      <span className="absolute -left-1.75 mt-1 h-3 w-3 rounded-full border-2 border-primary bg-surface" />
                      <p className="text-sm font-medium text-ink">{a.text}</p>
                      <p className="text-xs text-muted">{a.time}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </ThemeCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
