"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import {
  Avatar,
  Column,
  DataTable,
  FilterPill,
  StatusPill,
} from "@/src/components/ui/Datatable";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import * as React from "react";
import { AddEmployee } from "./components/AddEmployee/AddEmployee";
import { ViewEmployee } from "./components/ViewEmployee";

interface Person {
  id: string;
  name: string;
  avatar?: string;
  jobTitle: string;
  department: string;
  site: string;
  salary: number;
  joineddate: string;
  lifecycle: "Hired" | "Employed";
  status: "Active" | "Invited" | "Inactive";
}

const people: Person[] = [
  {
    id: "1",
    name: "Jai Saran",
    jobTitle: "Frontend Developer",
    department: "Engineering",
    site: "Nagercoil",
    salary: 65000,
    joineddate: "Mar 13, 2023",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "2",
    name: "Arun Kumar",
    jobTitle: "Backend Developer",
    department: "Engineering",
    site: "Nagercoil",
    salary: 72000,
    joineddate: "Oct 13, 2023",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "3",
    name: "Priya Mohan",
    jobTitle: "UI/UX Designer",
    department: "Product",
    site: "Marthandam",
    salary: 55000,
    joineddate: "Nov 4, 2023",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "4",
    name: "Vignesh Raj",
    jobTitle: "Sales Manager",
    department: "Sales",
    site: "Nagercoil",
    salary: 48000,
    joineddate: "Sep 4, 2021",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "5",
    name: "Keerthana S",
    jobTitle: "HR Executive",
    department: "Human Resources",
    site: "Kanyakumari",
    salary: 42000,
    joineddate: "Feb 21, 2023",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "6",
    name: "Ajith Kumar",
    jobTitle: "Mobile App Developer",
    department: "Engineering",
    site: "Nagercoil",
    salary: 68000,
    joineddate: "Aug 2, 2024",
    lifecycle: "Employed",
    status: "Inactive",
  },
  {
    id: "7",
    name: "Divya Prabhu",
    jobTitle: "QA Engineer",
    department: "Engineering",
    site: "Nagercoil",
    salary: 52000,
    joineddate: "Jan 15, 2024",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "8",
    name: "Suresh Babu",
    jobTitle: "Accountant",
    department: "Finance",
    site: "Nagercoil",
    salary: 45000,
    joineddate: "Jun 10, 2022",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "9",
    name: "Anitha Raj",
    jobTitle: "Marketing Executive",
    department: "Marketing",
    site: "Nagercoil",
    salary: 40000,
    joineddate: "Apr 18, 2024",
    lifecycle: "Employed",
    status: "Inactive",
  },
  {
    id: "10",
    name: "Praveen Kumar",
    jobTitle: "DevOps Engineer",
    department: "Engineering",
    site: "Nagercoil",
    salary: 85000,
    joineddate: "Jul 22, 2022",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "11",
    name: "Meena Lakshmi",
    jobTitle: "HR Manager",
    department: "Human Resources",
    site: "Nagercoil",
    salary: 75000,
    joineddate: "May 8, 2021",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "12",
    name: "Dinesh Kumar",
    jobTitle: "Support Engineer",
    department: "Support",
    site: "Marthandam",
    salary: 38000,
    joineddate: "Dec 12, 2023",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "13",
    name: "Swetha Maria",
    jobTitle: "Business Analyst",
    department: "Operations",
    site: "Kanyakumari",
    salary: 60000,
    joineddate: "Mar 5, 2024",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "14",
    name: "Antony Raj",
    jobTitle: "Project Manager",
    department: "Operations",
    site: "Nagercoil",
    salary: 95000,
    joineddate: "Aug 19, 2020",
    lifecycle: "Employed",
    status: "Active",
  },
  {
    id: "15",
    name: "Sanjay Kumar",
    jobTitle: "Junior Software Engineer",
    department: "Engineering",
    site: "Nagercoil",
    salary: 35000,
    joineddate: "Jan 6, 2025",
    lifecycle: "Hired",
    status: "Invited",
  },
];

const STATUS_ORDER: Record<Person["status"], number> = {
  Active: 1,
  Invited: 2,
  Inactive: 3,
};

const columns: Column<Person>[] = [
  {
    key: "name",
    header: "Name",
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <Avatar src={row.avatar} name={row.name} />
        <span className="font-medium text-stone-800">{row.name}</span>
      </div>
    ),
    sortValue: (row) => row.name,
    hideable: false,
  },
  { key: "jobTitle", header: "Job title", sortValue: (row) => row.jobTitle },
  {
    key: "department",
    header: "Department",
    sortValue: (row) => row.department,
  },
  {
    key: "location",
    header: "Location",
    accessor: (row) => (
      <span className="flex items-center gap-2">{row.site}</span>
    ),
    sortValue: (row) => row.site,
  },
  {
    key: "salary",
    header: "Salary",
    accessor: (row) => `$${row.salary.toLocaleString()}`,
    sortValue: (row) => row.salary,
  },
  {
    key: "joineddate",
    header: "Joined date",
    sortValue: (row) => row.joineddate,
  },
  { key: "lifecycle", header: "Lifecycle", sortValue: (row) => row.lifecycle },
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
  const toggle = (val: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  const clear = () => setSelected(new Set());
  const matches = (row: T) =>
    selected.size === 0 || selected.has(getValue(row));

  return { selected, options, toggle, clear, matches };
}

export default function PeoplePage() {
  const departmentFilter = useMultiFilter(people, (p) => p.department);
  const siteFilter = useMultiFilter(people, (p) => p.site);
  const lifecycleFilter = useMultiFilter(people, (p) => p.lifecycle);
  const statusFilter = useMultiFilter(people, (p) => p.status);
  const [editingEmployee, setEditingEmployee] = React.useState<Person | null>(
    null,
  );
  const [viewingEmployee, setViewingEmployee] = React.useState<Person | null>(
    null,
  );
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<Person | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  const filteredData = React.useMemo(
    () =>
      people
        .filter(
          (row) =>
            departmentFilter.matches(row) &&
            siteFilter.matches(row) &&
            lifecycleFilter.matches(row) &&
            statusFilter.matches(row),
        )
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [departmentFilter, siteFilter, lifecycleFilter, statusFilter],
  );

  const handleSave = (data: any) => {
    console.log("Saving employee:", data);
    // Implement your save logic here
    setIsAddDrawerOpen(false);
    setIsEditDrawerOpen(false);
  };

  const handleView = (person: Person) => {
    setViewingEmployee(person);
    setIsViewDrawerOpen(true);
  };

  const handleEdit = (person: Person) => {
    setEditingEmployee(person);
    setIsEditDrawerOpen(true);
  };

  const handleDeleteClick = (person: Person) => {
    setEmployeeToDelete(person);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    try {
      console.log("Deleting employee:", employeeToDelete);
      setIsDeleteAlertOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setEmployeeToDelete(null);
  };

  return (
    <div className="min-h-screen w-full py-4 px-3 sm:px-8 bg-[#F2F2F2]">
      <div className="flex flex-wrap items-center gap-3 mb-4 justify-between">
        <div className="flex gap-3 items-center">
          <div
            className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </div>

          <div className="text-lg sm:text-2xl font-light">
            Employee Management
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setEditingEmployee(null);
              setIsAddDrawerOpen(true);
            }}
            aria-label="Add"
            className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Employee</span>
          </button>

          <button
            onClick={() => {}}
            className="flex h-12 cursor-pointer items-center gap-2 rounded-lg bg-[#FF7F50] px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#E97451] hover:scale-105"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <DataTable
          data={filteredData}
          columns={columns}
          keyExtractor={(row: { id: any }) => row.id}
          searchKeys={["name", "jobTitle", "department", "site"]}
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
                label="Lifecycle"
                options={lifecycleFilter.options}
                selected={lifecycleFilter.selected}
                onToggle={lifecycleFilter.toggle}
                onClear={lifecycleFilter.clear}
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
          pageSize={10}
          onExport={(rows: any) => console.log("export", rows)}
          onViewRow={handleView}
          onEditRow={handleEdit}
          onDeleteRow={handleDeleteClick}
        />
      </div>

      <AddEmployee
        isOpen={isAddDrawerOpen}
        setIsOpen={setIsAddDrawerOpen}
        editingEmployee={null}
        onSave={handleSave}
      />

      <AddEmployee
        isOpen={isEditDrawerOpen}
        setIsOpen={setIsEditDrawerOpen}
        editingEmployee={editingEmployee}
        onSave={handleSave}
      />

      <ViewEmployee
        isOpen={isViewDrawerOpen}
        setIsOpen={setIsViewDrawerOpen}
        employee={viewingEmployee}
      />

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteAlertOpen(false);
            setEmployeeToDelete(null);
          }
        }}
        title="Delete Employee"
        description={`Are you sure you want to delete "${employeeToDelete?.name || "Employee"}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}
