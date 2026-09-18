"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import {
  Column,
  DataTable,
  FilterPill,
  StatusPill,
} from "@/src/components/ui/Datatable";
import { ArrowLeft, Plus, Upload, Users } from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { AddDepartment } from "../components/AddDepartment";
import { DepartmentBarChart } from "../components/DepartmentBarChart";

interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  headAvatar?: string;
  employeeCount: number;
  status: "Active" | "Inactive" | "Under Review";
  type: "Technical" | "Non-Technical" | "Administrative";
}

const departments: Department[] = [
  {
    id: "1",
    name: "Information Technology",
    code: "IT",
    head: "Preethiv Raj",
    headAvatar: "",
    employeeCount: 45,
    status: "Active",
    type: "Technical",
  },
  {
    id: "2",
    name: "Human Resources",
    code: "HR",
    head: "Keerthana S",
    headAvatar: "",
    employeeCount: 35,
    status: "Active",
    type: "Administrative",
  },
  {
    id: "3",
    name: "FMCG",
    code: "FMCG",
    head: "Meena Lakshmi",
    headAvatar: "",
    employeeCount: 25,
    status: "Active",
    type: "Non-Technical",
  },
  {
    id: "4",
    name: "Business Development",
    code: "BDE",
    head: "Vignesh Raj",
    headAvatar: "",
    employeeCount: 18,
    status: "Active",
    type: "Non-Technical",
  },
  {
    id: "5",
    name: "BPO",
    code: "BPO",
    head: "Dinesh Kumar",
    headAvatar: "",
    employeeCount: 30,
    status: "Active",
    type: "Non-Technical",
  },
  {
    id: "6",
    name: "Medical Department",
    code: "MED",
    head: "Dr. Priya Mohan",
    headAvatar: "",
    employeeCount: 20,
    status: "Active",
    type: "Technical",
  },
];

const STATUS_ORDER: Record<Department["status"], number> = {
  Active: 1,
  "Under Review": 2,
  Inactive: 3,
};

const columns: Column<Department>[] = [
  {
    key: "name",
    header: "Department",
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700 text-sm shrink-0">
          {row.code}
        </div>
        <div className="min-w-0">
          <span className="font-medium text-stone-800 truncate block">
            {row.name}
          </span>
          <span className="text-xs text-gray-500 block">{row.code}</span>
        </div>
      </div>
    ),
    sortValue: (row) => row.name,
    hideable: false,
  },
  {
    key: "employeeCount",
    header: "Employees",
    accessor: (row) => (
      <span className="font-semibold text-stone-700">{row.employeeCount}</span>
    ),
    sortValue: (row) => row.employeeCount,
  },
  {
    key: "type",
    header: "Type",
    accessor: (row) => (
      <span
        className={`p-2 rounded-md text-xs font-medium whitespace-nowrap ${
          row.type === "Technical"
            ? "bg-blue-100 text-blue-700"
            : row.type === "Administrative"
              ? "bg-purple-100 text-purple-700"
              : "bg-orange-100 text-orange-700"
        }`}
      >
        {row.type}
      </span>
    ),
    sortValue: (row) => row.type,
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

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export default function DepartmentsPage() {
  const typeFilter = useMultiFilter(departments, (d) => d.type);
  const statusFilter = useMultiFilter(departments, (d) => d.status);

  const [editingDepartment, setEditingDepartment] =
    React.useState<Department | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    React.useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const filteredData = React.useMemo(
    () =>
      departments
        .filter((row) => typeFilter.matches(row) && statusFilter.matches(row))
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [typeFilter, statusFilter],
  );

  useEffect(() => {
    if (!isDesktop || !tableContainerRef.current) return;

    const el = tableContainerRef.current;
    const observer = new ResizeObserver(() => {
      setTableHeight(el.offsetHeight);
    });

    observer.observe(el);
    setTableHeight(el.offsetHeight);

    return () => observer.disconnect();
  }, [isDesktop]);

  const handleSave = (data: any) => {
    if (data.id) {
      console.log("Updating department:", data);
    } else {
      console.log("Creating department:", data);
    }
    setIsAddDrawerOpen(false);
    setIsEditDrawerOpen(false);
    setEditingDepartment(null);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsEditDrawerOpen(true);
  };

  const handleDelete = (department: Department) => {
    setDepartmentToDelete(department);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!departmentToDelete) return;

    setIsDeleting(true);
    setTimeout(() => {
      console.log("Deleting department:", departmentToDelete);

      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
      setDepartmentToDelete(null);
    }, 1500);
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setDepartmentToDelete(null);
  };

  const departmentHeads = React.useMemo(() => {
    return departments.map((d) => ({
      name: d.head,
      department: d.name,
      code: d.code,
      employeeCount: d.employeeCount,
      status: d.status,
    }));
  }, []);

  return (
    <div className="min-h-screen w-full py-4 px-3 sm:px-6 lg:px-8 bg-[#F2F2F2] grid gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 items-center min-w-0">
          <div
            className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </div>
          <div className="text-lg sm:text-2xl font-light truncate">
            Department Management
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setEditingDepartment(null);
              setIsAddDrawerOpen(true);
            }}
            aria-label="Add"
            className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Department</span>
          </button>
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

      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        <DepartmentBarChart departments={filteredData} />
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        <div ref={tableContainerRef} className="w-full lg:w-[70%] min-w-0">
          <DataTable
            data={filteredData}
            columns={columns}
            keyExtractor={(row: { id: any }) => row.id}
            searchKeys={["name", "code", "head"]}
            filtersSlot={
              <>
                <FilterPill
                  label="Type"
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
            pageSize={10}
            onExport={(rows: any) => console.log("export", rows)}
            // onViewRow={handleView}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
          />
        </div>

        <div
          className="w-full lg:w-[30%] bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden"
          style={
            isDesktop && tableHeight > 0
              ? { height: `${tableHeight}px` }
              : undefined
          }
        >
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b border-gray-200 shrink-0">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-stone-800">
              Department Heads
            </h3>
          </div>

          {/* Scroll Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 max-h-105 lg:max-h-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {departmentHeads.map((head, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-blue-200"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center font-semibold text-white text-sm shrink-0">
                    {head.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {head.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {head.department}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">
                        Code: {head.code}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {head.employeeCount} employees
                      </span>
                    </div>
                  </div>

                  <StatusPill status={head.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddDepartment
        open={isAddDrawerOpen || isEditDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDrawerOpen(false);
            setIsEditDrawerOpen(false);
            setEditingDepartment(null);
          }
        }}
        department={isEditDrawerOpen ? editingDepartment : null}
        onSave={handleSave}
      />

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteAlertOpen(false);
            setDepartmentToDelete(null);
          }
        }}
        title="Delete Department"
        description={`Are you sure you want to delete "${departmentToDelete?.name || "Department"}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}
