"use client";

import {
  Avatar,
  Column,
  DataTable,
  FilterPill,
  StatusPill,
} from "@/src/components/ui/Datatable";

import {
  ArrowLeft,
  Calendar,
  Download,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ViewLeaveDetails } from "./components/ViewLeaveDetails";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type LeaveType =
  | "Annual Leave"
  | "Sick Leave"
  | "Casual Leave"
  | "Maternity Leave"
  | "Paternity Leave";

interface LeaveRequest {
  id: string;
  employeeId: string;
  name: string;
  avatar?: string;
  jobTitle: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  duration: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  reason?: string;
  appliedOn: string;
}

const leaveRequests: LeaveRequest[] = [
  {
    id: "1",
    employeeId: "EMP001",
    name: "Michael Chen",
    jobTitle: "Senior Engineer",
    department: "Engineering",
    type: "Annual Leave",
    startDate: "Oct 12, 2023",
    endDate: "Oct 16, 2023",
    duration: "5 days",
    status: "Pending",
    reason: "Family vacation to Japan",
    appliedOn: "Oct 5, 2023",
  },
  {
    id: "2",
    employeeId: "EMP002",
    name: "Sarah Jenkins",
    jobTitle: "Marketing Manager",
    department: "Marketing",
    type: "Sick Leave",
    startDate: "Oct 10, 2023",
    endDate: "Oct 11, 2023",
    duration: "2 days",
    status: "Pending",
    reason: "Medical appointment and recovery",
    appliedOn: "Oct 8, 2023",
  },
  {
    id: "3",
    employeeId: "EMP003",
    name: "David Ross",
    jobTitle: "Sales Executive",
    department: "Sales",
    type: "Casual Leave",
    startDate: "Oct 20, 2023",
    endDate: "Oct 20, 2023",
    duration: "1 day",
    status: "Pending",
    reason: "Personal errands",
    appliedOn: "Oct 15, 2023",
  },
  {
    id: "4",
    employeeId: "EMP004",
    name: "Emma Wilson",
    jobTitle: "Product Designer",
    department: "Product",
    type: "Annual Leave",
    startDate: "Oct 25, 2023",
    endDate: "Oct 27, 2023",
    duration: "3 days",
    status: "Approved",
    reason: "Weekend getaway",
    appliedOn: "Oct 1, 2023",
  },
  {
    id: "5",
    employeeId: "EMP005",
    name: "James Anderson",
    jobTitle: "DevOps Engineer",
    department: "Engineering",
    type: "Sick Leave",
    startDate: "Oct 18, 2023",
    endDate: "Oct 18, 2023",
    duration: "1 day",
    status: "Approved",
    reason: "Flu symptoms",
    appliedOn: "Oct 17, 2023",
  },
  {
    id: "6",
    employeeId: "EMP006",
    name: "Lisa Park",
    jobTitle: "HR Executive",
    department: "Human Resources",
    type: "Annual Leave",
    startDate: "Nov 1, 2023",
    endDate: "Nov 5, 2023",
    duration: "5 days",
    status: "Pending",
    reason: "International travel to Korea",
    appliedOn: "Oct 20, 2023",
  },
  {
    id: "7",
    employeeId: "EMP007",
    name: "Robert Kim",
    jobTitle: "Data Analyst",
    department: "Operations",
    type: "Casual Leave",
    startDate: "Oct 22, 2023",
    endDate: "Oct 22, 2023",
    duration: "1 day",
    status: "Rejected",
    reason: "Moving house",
    appliedOn: "Oct 18, 2023",
  },
  {
    id: "8",
    employeeId: "EMP008",
    name: "Maria Garcia",
    jobTitle: "QA Lead",
    department: "Engineering",
    type: "Maternity Leave",
    startDate: "Dec 1, 2023",
    endDate: "Mar 1, 2024",
    duration: "3 months",
    status: "Approved",
    reason: "Maternity leave",
    appliedOn: "Oct 10, 2023",
  },
  {
    id: "9",
    employeeId: "EMP001",
    name: "Michael Chen",
    jobTitle: "Senior Engineer",
    department: "Engineering",
    type: "Annual Leave",
    startDate: "Aug 15, 2023",
    endDate: "Aug 18, 2023",
    duration: "4 days",
    status: "Approved",
    reason: "Summer vacation",
    appliedOn: "Jul 20, 2023",
  },
  {
    id: "10",
    employeeId: "EMP001",
    name: "Michael Chen",
    jobTitle: "Senior Engineer",
    department: "Engineering",
    type: "Sick Leave",
    startDate: "Jun 10, 2023",
    endDate: "Jun 12, 2023",
    duration: "3 days",
    status: "Approved",
    reason: "Medical leave",
    appliedOn: "Jun 5, 2023",
  },
  {
    id: "11",
    employeeId: "EMP001",
    name: "Michael Chen",
    jobTitle: "Senior Engineer",
    department: "Engineering",
    type: "Casual Leave",
    startDate: "May 5, 2023",
    endDate: "May 5, 2023",
    duration: "1 day",
    status: "Rejected",
    reason: "Personal work",
    appliedOn: "Apr 28, 2023",
  },
];

/* -------------------------------------------------------------------------- */
/* Status Ordering                                                            */
/* -------------------------------------------------------------------------- */

const STATUS_ORDER: Record<LeaveRequest["status"], number> = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
  Cancelled: 4,
};

/* -------------------------------------------------------------------------- */
/* Table Columns                                                              */
/* -------------------------------------------------------------------------- */

const columns: Column<LeaveRequest>[] = [
  {
    key: "employee_name",
    header: "Employee",
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <Avatar src={row.avatar} name={row.name} />
        <div className="min-w-0">
          <div className="font-medium text-ink truncate">{row.name}</div>
          <div className="text-xs text-muted truncate">{row.employeeId}</div>
        </div>
      </div>
    ),
    sortValue: (row) => row.name,
    hideable: false,
  },
  {
    key: "department",
    header: "Department",
    sortValue: (row) => row.department,
  },
  {
    key: "type",
    header: "Leave Type",
    accessor: (row) => (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-primary border border-blue-200">
        {row.type}
      </span>
    ),
    sortValue: (row) => row.type,
  },
  {
    key: "dates",
    header: "Dates & Duration",
    accessor: (row) => (
      <div>
        <div className="text-sm font-medium">
          {row.startDate} - {row.endDate}
        </div>
        <div className="text-xs text-muted">{row.duration}</div>
      </div>
    ),
    sortValue: (row) => row.startDate,
  },
  {
    key: "status",
    header: "Status",
    accessor: (row) => <StatusPill status={row.status} />,
    sortValue: (row) => row.status,
  },
];

/* -------------------------------------------------------------------------- */
/* Multi Filter                                                               */
/* -------------------------------------------------------------------------- */

function useMultiFilter<T>(data: T[], getValue: (row: T) => string) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const options = React.useMemo(
    () => Array.from(new Set(data.map(getValue))).filter(Boolean),
    [data, getValue],
  );

  const toggle = (value: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });

  const clear = () => setSelected(new Set());

  const matches = (row: T) =>
    selected.size === 0 || selected.has(getValue(row));

  return { selected, options, toggle, clear, matches };
}

/* -------------------------------------------------------------------------- */
/* Statistics Card                                                            */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "teal";
  trend?: {
    value: number;
    label: string;
  };
}

const colorVariants = {
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  green: "bg-emerald-50 text-emerald-600 border-emerald-200",
  purple: "bg-purple-50 text-purple-600 border-purple-200",
  orange: "bg-amber-50 text-amber-600 border-amber-200",
  red: "bg-red-50 text-red-600 border-red-200",
  teal: "bg-teal-50 text-teal-600 border-teal-200",
};

function StatCard({
  label,
  value,
  icon,
  color = "blue",
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 sm:p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-muted">{label}</div>
          <div className="text-2xl sm:text-3xl font-semibold text-ink mt-1">
            {value.toLocaleString()}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span
                className={`${trend.value >= 0 ? "text-emerald-600" : "text-red-600"} font-medium`}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-muted">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorVariants[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LeaveManagementPage() {
  const router = useRouter(); // 👈 add this line

  const departmentFilter = useMultiFilter(
    leaveRequests,
    (item) => item.department,
  );
  const typeFilter = useMultiFilter(leaveRequests, (item) => item.type);
  const statusFilter = useMultiFilter(leaveRequests, (item) => item.status);

  const [selectedRequest, setSelectedRequest] =
    React.useState<LeaveRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);

  const filteredData = React.useMemo(
    () =>
      leaveRequests
        .filter(
          (row) =>
            departmentFilter.matches(row) &&
            typeFilter.matches(row) &&
            statusFilter.matches(row),
        )
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [departmentFilter, typeFilter, statusFilter],
  );

  // Statistics
  const stats = React.useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((r) => r.status === "Pending").length;
    const approved = leaveRequests.filter(
      (r) => r.status === "Approved",
    ).length;
    const rejected = leaveRequests.filter(
      (r) => r.status === "Rejected",
    ).length;

    return { total, pending, approved, rejected };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const handleView = (row: LeaveRequest) => {
    setSelectedRequest(row);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (row: LeaveRequest) => {
    console.log("Edit leave request:", row);
  };

  const handleDelete = (row: LeaveRequest) => {
    if (
      confirm(`Are you sure you want to delete leave request for ${row.name}?`)
    ) {
      console.log("Deleting leave request:", row);
    }
  };

  const handleApprove = (id: string) => {
    console.log("Approving leave request:", id);
    // Update status logic here
  };

  const handleReject = (id: string) => {
    console.log("Rejecting leave request:", id);
    // Update status logic here
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#F2F2F2] py-4 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-3 items-center min-w-0">
            <div
              className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary transition-colors"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-light truncate">
                Leave Management
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              aria-label="Export"
              className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-[#FF7F50] px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#E97451] hover:scale-[1.02]"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Requests"
            value={stats.total}
            icon={<Users className="h-5 w-5" />}
            color="blue"
            trend={{ value: 12, label: "vs last month" }}
          />
          <StatCard
            label="Needs Action"
            value={stats.pending}
            icon={<UserCheck className="h-5 w-5" />}
            color="orange"
            trend={{ value: -5, label: "vs last month" }}
          />
          <StatCard
            label="Approved Today"
            value={stats.approved}
            icon={<Calendar className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            label="On Leave Today"
            value={3}
            icon={<UserMinus className="h-5 w-5" />}
            color="purple"
          />
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredData}
          columns={columns}
          keyExtractor={(row: LeaveRequest) => row.id}
          searchKeys={["name", "employeeId", "jobTitle", "department", "type"]}
          filtersSlot={
            <>
              <FilterPill
                label="Department"
                options={departmentFilter.options}
                selected={departmentFilter.selected}
                onToggle={departmentFilter.toggle}
                onClear={departmentFilter.clear}
              />
              <FilterPill
                label="Leave Type"
                options={typeFilter.options}
                selected={typeFilter.selected}
                onToggle={typeFilter.toggle}
                onClear={typeFilter.clear}
              />
              <FilterPill
                label="Status"
                options={statusFilter.options}
                selected={statusFilter.selected}
                onToggle={statusFilter.toggle}
                onClear={statusFilter.clear}
              />
            </>
          }
          pageSize={8}
          onExport={(rows: LeaveRequest[]) =>
            console.log("Export leave requests:", rows)
          }
          onViewRow={handleView}
        />
      </div>

      {/* View Leave Details Dialog */}
      <ViewLeaveDetails
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        leave={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        allLeaveRequests={leaveRequests}
      />
    </div>
  );
}
