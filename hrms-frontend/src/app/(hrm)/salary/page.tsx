"use client";

import {
  Avatar,
  Column,
  DataTable,
  FilterPill,
} from "@/src/components/ui/Datatable";
import { Select, type SelectOption } from "@/src/components/ui/Select";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import * as React from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const DEFAULT_COUNTUP_DURATION = 900;

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
      setDisplay(eased * value);
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
  return <>{formatter ? formatter(animated) : Math.round(animated)}</>;
}

type PaymentStatus = "Paid" | "Processing" | "On Hold";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  avatarUrl?: string;
  department: "Engineering" | "Marketing" | "Finance" | "Sales" | "Operations";
  baseSalary: number;
  allowances: number;
  deductions: number;
  status: PaymentStatus;
}

const EMPLOYEES: Employee[] = [
  {
    id: "1",
    employeeId: "EMP-2041",
    name: "Sarah Jenkins",
    department: "Engineering",
    baseSalary: 8500,
    allowances: 1200,
    deductions: 1450,
    status: "Paid",
  },
  {
    id: "2",
    employeeId: "EMP-1892",
    name: "Marcus Rodriguez",
    department: "Marketing",
    baseSalary: 6000,
    allowances: 500,
    deductions: 1100,
    status: "Processing",
  },
  {
    id: "3",
    employeeId: "EMP-1077",
    name: "David Chen",
    department: "Finance",
    baseSalary: 7800,
    allowances: 800,
    deductions: 1500,
    status: "Paid",
  },
  {
    id: "4",
    employeeId: "EMP-2210",
    name: "Priya Nair",
    department: "Engineering",
    baseSalary: 9200,
    allowances: 1000,
    deductions: 1680,
    status: "Paid",
  },
  {
    id: "5",
    employeeId: "EMP-1655",
    name: "Olivia Brooks",
    department: "Sales",
    baseSalary: 5400,
    allowances: 950,
    deductions: 890,
    status: "Processing",
  },
  {
    id: "6",
    employeeId: "EMP-1330",
    name: "James Okafor",
    department: "Operations",
    baseSalary: 6100,
    allowances: 400,
    deductions: 760,
    status: "Paid",
  },
  {
    id: "7",
    employeeId: "EMP-2088",
    name: "Elena Petrova",
    department: "Engineering",
    baseSalary: 8800,
    allowances: 1100,
    deductions: 1520,
    status: "On Hold",
  },
  {
    id: "8",
    employeeId: "EMP-1904",
    name: "Noah Williams",
    department: "Marketing",
    baseSalary: 5800,
    allowances: 600,
    deductions: 940,
    status: "Paid",
  },
  {
    id: "9",
    employeeId: "EMP-1467",
    name: "Aisha Khan",
    department: "Finance",
    baseSalary: 7200,
    allowances: 700,
    deductions: 1210,
    status: "Paid",
  },
  {
    id: "10",
    employeeId: "EMP-2355",
    name: "Liam Carter",
    department: "Sales",
    baseSalary: 5000,
    allowances: 850,
    deductions: 780,
    status: "Processing",
  },
  {
    id: "11",
    employeeId: "EMP-1198",
    name: "Grace Kim",
    department: "Operations",
    baseSalary: 6400,
    allowances: 450,
    deductions: 810,
    status: "Paid",
  },
  {
    id: "12",
    employeeId: "EMP-2401",
    name: "Ethan Brooks",
    department: "Engineering",
    baseSalary: 9500,
    allowances: 1300,
    deductions: 1740,
    status: "Paid",
  },
];

const TREND_DATA = [
  { month: "Jan", value: 0.72 },
  { month: "Feb", value: 0.65 },
  { month: "Mar", value: 0.84 },
  { month: "Apr", value: 0.58 },
  { month: "May", value: 0.7 },
  { month: "Jun", value: 0.44 },
  { month: "Jul", value: 0.76 },
  { month: "Aug", value: 0.6 },
  { month: "Sep", value: 1.02 },
  { month: "Oct", value: 1.21 },
];

const STATUS_META: Record<
  PaymentStatus,
  { label: string; color: string; badgeClass: string }
> = {
  Paid: {
    label: "Payment Done",
    color: "#22c55e",
    badgeClass: "bg-green-100 text-green-700",
  },
  Processing: {
    label: "Payment Progress",
    color: "#f59e0b",
    badgeClass: "bg-yellow-100 text-yellow-700",
  },
  "On Hold": {
    label: "Payment Cancelled",
    color: "#ef4444",
    badgeClass: "bg-red-100 text-red-700",
  },
};
const STATUS_ORDER: PaymentStatus[] = ["Paid", "Processing", "On Hold"];

const currency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const formatCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return currency(n);
};

function StatCard({
  label,
  value,
  formatter,
  delta,
  trend,
  icon,
  iconClassName,
}: {
  label: string;
  value: number;
  formatter?: (n: number) => string;
  delta: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 ">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
      <div className="text-3xl font-bold text-ink">
        <CountUp value={value} formatter={formatter} />
      </div>
      <div
        className={`mt-2 flex items-center gap-1 text-xs font-medium ${
          trend === "up" ? "text-green-600" : "text-red-600"
        }`}
      >
        {trend === "up" ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}
        {delta}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium ${meta.badgeClass}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function SalaryManagementPage() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date(2023, 9, 1));
  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function goToPrevMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }
  function goToNextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }

  const [statusFilter, setStatusFilter] = React.useState<Set<string>>(
    new Set(),
  );
  const [selectedDepartment, setSelectedDepartment] =
    React.useState<string>("all");

  const departments = React.useMemo(
    () => Array.from(new Set(EMPLOYEES.map((e) => e.department))),
    [],
  );

  const departmentOptions: SelectOption[] = React.useMemo(
    () => [
      { label: "All Departments", value: "all" },
      ...departments.map((d) => ({ label: d, value: d })),
    ],
    [departments],
  );

  function toggleStatus(value: string) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  const departmentFilteredEmployees = React.useMemo(
    () =>
      EMPLOYEES.filter(
        (e) =>
          selectedDepartment === "all" || e.department === selectedDepartment,
      ),
    [selectedDepartment],
  );

  const filteredEmployees = React.useMemo(() => {
    return departmentFilteredEmployees.filter((e) => {
      if (statusFilter.size > 0 && !statusFilter.has(e.status)) return false;
      return true;
    });
  }, [departmentFilteredEmployees, statusFilter]);

  const totals = React.useMemo(() => {
    const gross = filteredEmployees.reduce(
      (sum, e) => sum + e.baseSalary + e.allowances,
      0,
    );
    const deductions = filteredEmployees.reduce(
      (sum, e) => sum + e.deductions,
      0,
    );
    const paidCount = filteredEmployees.filter(
      (e) => e.status === "Paid",
    ).length;
    return {
      gross,
      deductions,
      net: gross - deductions,
      count: filteredEmployees.length,
      paidCount,
    };
  }, [filteredEmployees]);

  const departmentWeight = React.useMemo(() => {
    if (selectedDepartment === "all") return 1;
    const companyTotal = EMPLOYEES.reduce(
      (sum, e) => sum + e.baseSalary + e.allowances,
      0,
    );
    if (companyTotal === 0) return 0;
    const deptTotal = EMPLOYEES.filter(
      (e) => e.department === selectedDepartment,
    ).reduce((sum, e) => sum + e.baseSalary + e.allowances, 0);
    return deptTotal / companyTotal;
  }, [selectedDepartment]);

  const trendData = React.useMemo(
    () =>
      TREND_DATA.map((point) => ({
        ...point,
        value: point.value * departmentWeight,
      })),
    [departmentWeight],
  );

  const distribution = React.useMemo(() => {
    const totalsByStatus = new Map<
      PaymentStatus,
      { amount: number; count: number }
    >();
    departmentFilteredEmployees.forEach((e) => {
      const net = e.baseSalary + e.allowances - e.deductions;
      const entry = totalsByStatus.get(e.status) || { amount: 0, count: 0 };
      entry.amount += net;
      entry.count += 1;
      totalsByStatus.set(e.status, entry);
    });
    const grandTotal = Array.from(totalsByStatus.values()).reduce(
      (sum, v) => sum + v.amount,
      0,
    );
    return STATUS_ORDER.filter((status) => totalsByStatus.has(status)).map(
      (status) => {
        const entry = totalsByStatus.get(status)!;
        return {
          status,
          label: STATUS_META[status].label,
          color: STATUS_META[status].color,
          amount: entry.amount,
          count: entry.count,
          percent:
            grandTotal === 0
              ? 0
              : Math.round((entry.amount / grandTotal) * 100),
        };
      },
    );
  }, [departmentFilteredEmployees]);

  const paidSlice = distribution.find((d) => d.status === "Paid");
  const centerPercent = paidSlice?.percent ?? 0;

  const statCards = [
    {
      label: "Total Payroll",
      value: totals.gross,
      formatter: formatCompact,
      delta:
        selectedDepartment === "all"
          ? "All departments"
          : `${selectedDepartment} only`,
      trend: "up" as const,
      icon: <Wallet className="h-4.5 w-4.5 text-primary" />,
      iconClassName: "bg-primary/10",
    },
    {
      label: "Net Salary",
      value: totals.net,
      formatter: formatCompact,
      delta: "After deductions",
      trend: "up" as const,
      icon: <Wallet className="h-4.5 w-4.5 text-green-600" />,
      iconClassName: "bg-green-100",
    },
    {
      label: "Total Deductions",
      value: totals.deductions,
      formatter: formatCompact,
      delta: "This period",
      trend: "down" as const,
      icon: <FileText className="h-4.5 w-4.5 text-orange-600" />,
      iconClassName: "bg-orange-100",
    },
    {
      label: "Employees Paid",
      value: totals.count,
      delta: `${totals.paidCount} marked paid`,
      trend: "up" as const,
      icon: <Users className="h-4.5 w-4.5 text-primary" />,
      iconClassName: "bg-primary/10",
    },
  ];

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      sortValue: (row) => row.name,
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatarUrl} name={row.name} />
          <div>
            <div className="font-semibold text-ink">{row.name}</div>
            <div className="text-xs text-muted">{row.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortValue: (row) => row.department,
    },
    {
      key: "baseSalary",
      header: "Base Salary",
      sortValue: (row) => row.baseSalary,
      cellClassName: "text-center",
      className: "text-center",
      accessor: (row) => currency(row.baseSalary),
    },
    {
      key: "allowances",
      header: "Allowances",
      sortValue: (row) => row.allowances,
      cellClassName: "text-center",
      className: "text-center",
      accessor: (row) => currency(row.allowances),
    },
    {
      key: "deductions",
      header: "Deductions",
      sortValue: (row) => row.deductions,
      cellClassName: "text-center text-red-600 font-medium",
      className: "text-center",
      accessor: (row) => `-${currency(row.deductions)}`,
    },
    {
      key: "netPay",
      header: "Net Pay",
      sortValue: (row) => row.baseSalary + row.allowances - row.deductions,
      cellClassName: "text-center font-semibold text-primary",
      className: "text-center",
      accessor: (row) =>
        currency(row.baseSalary + row.allowances - row.deductions),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      accessor: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] p-4 sm:p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-[1600px] flex-col"
      >
        <motion.div
          variants={fadeUp}
          className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex gap-3 items-center min-w-0">
            <div
              className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
            </div>
            <div className="text-lg sm:text-2xl font-light truncate">
              Salary Management
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select
                options={departmentOptions}
                value={selectedDepartment}
                onChange={(v) => setSelectedDepartment(v as string)}
                placeholder="All Departments"
                clearable={true}
                className="bg-white"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
              <button
                type="button"
                onClick={goToPrevMonth}
                aria-label="Previous month"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-ink transition-all duration-200 hover:bg-surface-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-32 px-2 text-center text-sm font-semibold text-ink">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                aria-label="Next month"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-ink transition-all duration-200 hover:bg-surface-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition-all duration-200 hover:bg-surface-muted">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </motion.div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <motion.div key={card.label} variants={fadeUp}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div
            variants={fadeUp}
            className="rounded-xl border border-border bg-surface p-6  lg:col-span-2"
          >
            <h3 className="mb-4 text-lg font-bold text-ink">
              Salary Turnover Trend
              {selectedDepartment !== "all" && (
                <span className="text-muted"> — {selectedDepartment}</span>
              )}
            </h3>
            <div className="h-72">
              <ResponsiveContainer
                key={selectedDepartment}
                width="100%"
                height="100%"
              >
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#28345f"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#28345f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    tickFormatter={(v: number) => `$${v.toFixed(1)}M`}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `$${Number(value).toFixed(2)}M`,
                      "Payroll",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#28345f"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                    dot={{ r: 3, fill: "#28345f" }}
                    isAnimationActive
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-xl border border-border bg-surface p-6 "
          >
            <h3 className="mb-1 text-lg font-bold text-ink">
              Payroll Distribution
            </h3>
            <p className="mb-4 text-xs text-muted">
              By payment status, this period
            </p>

            <div className="relative h-56">
              <ResponsiveContainer
                key={selectedDepartment}
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="percent"
                    nameKey="label"
                    innerRadius="72%"
                    outerRadius="100%"
                    paddingAngle={2}
                    stroke="none"
                    onClick={(entry: any) => toggleStatus(entry.status)}
                    cursor="pointer"
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  >
                    {distribution.map((d) => {
                      const isDimmed =
                        statusFilter.size > 0 && !statusFilter.has(d.status);
                      return (
                        <Cell
                          key={d.status}
                          fill={d.color}
                          opacity={isDimmed ? 0.35 : 1}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(_value: any, _name: any, item: any) => {
                      const d = item?.payload;
                      return [
                        `${formatCompact(d?.amount ?? 0)} · ${d?.percent ?? 0}%`,
                        d?.label,
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-ink">
                  <CountUp
                    value={centerPercent}
                    formatter={(n) => `${Math.round(n)}%`}
                  />
                </span>
                <span className="text-xs text-muted">Paid</span>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {distribution.map((d) => {
                const isActive = statusFilter.has(d.status);
                return (
                  <button
                    key={d.status}
                    type="button"
                    onClick={() => toggleStatus(d.status)}
                    title={`Filter table by ${d.label}`}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-all duration-200 ${
                      isActive ? "bg-primary/10" : "hover:bg-surface-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-ink-soft">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.label}
                      <span className="text-xs text-muted">({d.count})</span>
                    </span>
                    <span className="font-semibold text-ink">
                      <CountUp
                        value={d.percent}
                        formatter={(n) => `${Math.round(n)}%`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
            {statusFilter.size > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter(new Set())}
                className="mt-2 w-full cursor-pointer text-center text-xs text-muted transition-colors hover:text-primary"
              >
                Clear status filter
              </button>
            )}
          </motion.div>
        </div>

        {/* Employee salary table */}
        <motion.div variants={fadeUp}>
          <DataTable<Employee>
            data={filteredEmployees}
            columns={columns}
            keyExtractor={(row) => row.id}
            searchKeys={["name", "employeeId"]}
            searchPlaceholder="Search employees..."
            enableSearch
            enableFilter={false}
            enableColumnVisibility
            pageSize={10}
            onViewRow={(row) => console.log("View payslip for", row.name)}
            actionColumnHeader="Actions"
            emptyMessage="No employees match the selected filters."
            filtersSlot={
              <FilterPill
                label="Status"
                options={STATUS_ORDER}
                selected={statusFilter}
                onToggle={toggleStatus}
                onClear={() => setStatusFilter(new Set())}
              />
            }
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SalaryManagementPage;
