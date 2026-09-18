"use client";

import {
  Avatar,
  Column,
  DataTable,
  FilterPill,
  StatusPill,
} from "@/src/components/ui/Datatable";

import { isSameDay, parse } from "date-fns";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { ArrowLeft, Upload } from "lucide-react";
import * as React from "react";
import { AttendanceBarChart } from "./components/AttendanceBarChart";
import { AttendanceCalendar } from "./components/AttendanceCalendar";
import { ViewAttendanceDetails } from "./components/ViewAttendanceDetails";

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
}

const attendance: Attendance[] = [
  {
    id: "1",
    employeeId: "EMP001",
    name: "Jai Saran",
    jobTitle: "Frontend Developer",
    department: "Engineering",
    site: "Nagercoil",
    date: "Aug 23, 2026",
    checkIn: "09:12 AM",
    checkOut: "06:05 PM",
    workHours: "8h 23m",
    status: "Present",
  },
  {
    id: "2",
    employeeId: "EMP002",
    name: "Arun Kumar",
    jobTitle: "Backend Developer",
    department: "Engineering",
    site: "Nagercoil",
    date: "Aug 25, 2026",
    checkIn: "09:00 AM",
    checkOut: "06:10 PM",
    workHours: "7h 55m",
    status: "Late",
  },
  {
    id: "3",
    employeeId: "EMP003",
    name: "Priya Mohan",
    jobTitle: "UI/UX Designer",
    department: "Product",
    site: "Marthandam",
    date: "Aug 21, 2026",
    checkIn: null,
    checkOut: null,
    workHours: "0h 00m",
    status: "Absent",
  },
  {
    id: "4",
    employeeId: "EMP004",
    name: "Vignesh Raj",
    jobTitle: "Sales Manager",
    department: "Sales",
    site: "Nagercoil",
    date: "Aug 21, 2026",
    checkIn: "09:05 AM",
    checkOut: "01:15 PM",
    workHours: "4h 10m",
    status: "Half Day",
  },
  {
    id: "5",
    employeeId: "EMP005",
    name: "Keerthana S",
    jobTitle: "HR Executive",
    department: "Human Resources",
    site: "Kanyakumari",
    date: "Aug 21, 2026",
    checkIn: null,
    checkOut: null,
    workHours: "0h 00m",
    status: "On Leave",
  },
  {
    id: "6",
    employeeId: "EMP006",
    name: "Ajith Kumar",
    jobTitle: "Mobile App Developer",
    department: "Engineering",
    site: "Nagercoil",
    date: "Aug 21, 2026",
    checkIn: "09:20 AM",
    checkOut: "06:00 PM",
    workHours: "8h 10m",
    status: "Present",
  },
  {
    id: "7",
    employeeId: "EMP007",
    name: "Divya Prabhu",
    jobTitle: "QA Engineer",
    department: "Engineering",
    site: "Nagercoil",
    date: "Aug 25, 2026",
    checkIn: "09:08 AM",
    checkOut: "05:45 PM",
    workHours: "8h 07m",
    status: "Present",
  },
  {
    id: "8",
    employeeId: "EMP008",
    name: "Suresh Babu",
    jobTitle: "Accountant",
    department: "Finance",
    site: "Nagercoil",
    date: "Aug 21, 2026",
    checkIn: "09:55 AM",
    checkOut: "06:15 PM",
    workHours: "7h 50m",
    status: "Late",
  },
  {
    id: "9",
    employeeId: "EMP009",
    name: "Anitha Raj",
    jobTitle: "Marketing Executive",
    department: "Marketing",
    site: "Nagercoil",
    date: "Aug 21, 2026",
    checkIn: "09:10 AM",
    checkOut: "01:05 PM",
    workHours: "3h 55m",
    status: "Half Day",
  },
  {
    id: "10",
    employeeId: "EMP010",
    name: "Praveen Kumar",
    jobTitle: "DevOps Engineer",
    department: "Engineering",
    site: "Nagercoil",
    date: "Aug 21, 2026",
    checkIn: "08:55 AM",
    checkOut: "06:20 PM",
    workHours: "8h 40m",
    status: "Present",
  },
  {
    id: "11",
    employeeId: "EMP011",
    name: "Meena Lakshmi",
    jobTitle: "HR Manager",
    department: "Human Resources",
    site: "Nagercoil",
    date: "Aug 21, 2026",
    checkIn: "09:00 AM",
    checkOut: "06:00 PM",
    workHours: "8h 30m",
    status: "Present",
  },
  {
    id: "12",
    employeeId: "EMP012",
    name: "Dinesh Kumar",
    jobTitle: "Support Engineer",
    department: "Support",
    site: "Marthandam",
    date: "Aug 21, 2026",
    checkIn: "09:35 AM",
    checkOut: "06:05 PM",
    workHours: "8h 00m",
    status: "Late",
  },
  {
    id: "13",
    employeeId: "EMP013",
    name: "Swetha Maria",
    jobTitle: "Business Analyst",
    department: "Operations",
    site: "Kanyakumari",
    date: "Aug 21, 2026",
    checkIn: "09:05 AM",
    checkOut: "06:00 PM",
    workHours: "8h 25m",
    status: "Present",
  },
  {
    id: "14",
    employeeId: "EMP014",
    name: "Antony Raj",
    jobTitle: "Project Manager",
    department: "Operations",
    site: "Nagercoil",
    date: "Aug 21, 2026",
    checkIn: "08:50 AM",
    checkOut: "06:15 PM",
    workHours: "8h 40m",
    status: "Present",
  },
  {
    id: "15",
    employeeId: "EMP015",
    name: "Sanjay Kumar",
    jobTitle: "Junior Software Engineer",
    department: "Engineering",
    site: "Nagercoil",
    date: "Aug 21, 2026",
    checkIn: "10:10 AM",
    checkOut: "06:00 PM",
    workHours: "7h 20m",
    status: "Late",
  },
];

const STATUS_ORDER: Record<AttendanceStatus, number> = {
  Present: 1,
  Late: 2,
  "Work From Home": 3,
  "Half Day": 4,
  "On Leave": 5,
  Absent: 6,
};

const columns: Column<Attendance>[] = [
  {
    key: "employee_name",
    header: "Employee Name",
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
    key: "date",
    header: "Date",
    sortValue: (row) => row.date,
  },

  {
    key: "checkIn",
    header: "Check In",
    accessor: (row) => (
      <span className={row.checkIn ? "text-ink" : "text-muted"}>
        {row.checkIn ?? "--"}
      </span>
    ),
    sortValue: (row) => row.checkIn ?? "",
  },

  {
    key: "checkOut",
    header: "Check Out",
    accessor: (row) => (
      <span className={row.checkOut ? "text-ink" : "text-muted"}>
        {row.checkOut ?? "--"}
      </span>
    ),
    sortValue: (row) => row.checkOut ?? "",
  },

  {
    key: "workHours",
    header: "Work Hours",
    accessor: (row) => (
      <span className="font-medium text-ink">{row.workHours}</span>
    ),
    sortValue: (row) => row.workHours,
  },

  {
    key: "status",
    header: "Status",
    accessor: (row) => <StatusPill status={row.status} />,
    sortValue: (row) => row.status,
  },
];

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

  const clear = () => {
    setSelected(new Set());
  };

  const matches = (row: T) =>
    selected.size === 0 || selected.has(getValue(row));

  return {
    selected,
    options,
    toggle,
    clear,
    matches,
  };
}

function parseAttendanceDate(value: string) {
  return parse(value, "MMM d, yyyy", new Date());
}

function useDateFilter(data: Attendance[]) {
  const [selected, setSelected] = React.useState<Date | null>(null);

  const markedDates = React.useMemo(
    () => data.map((row) => parseAttendanceDate(row.date)),
    [data],
  );

  const matches = (row: Attendance) =>
    !selected || isSameDay(parseAttendanceDate(row.date), selected);

  return {
    selected,
    setSelected,
    markedDates,
    matches,
  };
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const COUNT_DURATION = 1.2;

function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const motionValue = useMotionValue(0);

  const display = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString(),
  );

  const [text, setText] = React.useState("0");

  React.useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: COUNT_DURATION,
      ease: EASE_OUT,
    });

    const unsubscribe = display.on("change", setText);

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionValue, display]);

  return <span className={className}>{text}</span>;
}

export default function AttendancePage() {
  const departmentFilter = useMultiFilter(
    attendance,
    (item) => item.department,
  );

  const siteFilter = useMultiFilter(attendance, (item) => item.site);

  const statusFilter = useMultiFilter(attendance, (item) => item.status);

  const dateFilter = useDateFilter(attendance);

  const [selectedAttendance, setSelectedAttendance] =
    React.useState<Attendance | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);

  const filteredData = React.useMemo(
    () =>
      attendance
        .filter(
          (row) =>
            departmentFilter.matches(row) &&
            siteFilter.matches(row) &&
            statusFilter.matches(row) &&
            dateFilter.matches(row),
        )
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [departmentFilter, siteFilter, statusFilter, dateFilter],
  );

  const handleView = (row: Attendance) => {
    setSelectedAttendance(row);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (row: Attendance) => {
    console.log("Edit attendance:", row);
  };

  const handleDelete = (row: Attendance) => {
    if (
      confirm(`Are you sure you want to delete attendance for ${row.name}?`)
    ) {
      console.log("Deleting attendance:", row);
    }
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
            <div
              className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
            </div>
            <div className="text-lg sm:text-2xl font-light truncate">
              Attendance Management
            </div>
          </div>
          <button
            onClick={() => {}}
            aria-label="Export"
            className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-[#FF7F50] px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#E97451] hover:scale-105"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="w-full px-3 sm:px-6 lg:px-8 py-4">
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
          <AttendanceCalendar
            selected={dateFilter.selected}
            onSelect={dateFilter.setSelected}
          />

          <AttendanceBarChart
            data={filteredData}
            selectedDate={dateFilter.selected}
          />
        </div>

        <DataTable
          data={filteredData}
          columns={columns}
          keyExtractor={(row: Attendance) => row.id}
          searchKeys={["name", "employeeId", "jobTitle", "department", "site"]}
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
                label="Site"
                options={siteFilter.options}
                selected={siteFilter.selected}
                onToggle={siteFilter.toggle}
                onClear={siteFilter.clear}
              />

              <FilterPill
                label="Attendance"
                options={statusFilter.options}
                selected={statusFilter.selected}
                onToggle={statusFilter.toggle}
                onClear={statusFilter.clear}
              />
            </>
          }
          pageSize={8}
          onExport={(rows: Attendance[]) =>
            console.log("Export attendance:", rows)
          }
          onViewRow={handleView}
          // onEditRow={handleEdit}
          // onDeleteRow={handleDelete}
        />
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
