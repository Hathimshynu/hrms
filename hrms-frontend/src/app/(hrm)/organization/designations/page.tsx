"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import {
  Column,
  DataTable,
  FilterPill,
  StatusPill,
} from "@/src/components/ui/Datatable";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import * as React from "react";
import { AddDesignation } from "../components/AddDesignation";

interface Designation {
  id: string;
  name: string;
  code: string;
  department: string;
  employeeCount: number;
  status: "Active" | "Inactive" | "Under Review";
  level: "Entry" | "Mid" | "Senior" | "Lead" | "Manager";
}

const initialDesignations: Designation[] = [
  {
    id: "1",
    name: "Software Engineer",
    code: "SE",
    department: "Information Technology",
    employeeCount: 15,
    status: "Active",
    level: "Mid",
  },
  {
    id: "2",
    name: "Senior Software Engineer",
    code: "SSE",
    department: "Information Technology",
    employeeCount: 8,
    status: "Active",
    level: "Senior",
  },
  {
    id: "3",
    name: "HR Executive",
    code: "HRE",
    department: "Human Resources",
    employeeCount: 10,
    status: "Active",
    level: "Entry",
  },
  {
    id: "4",
    name: "HR Manager",
    code: "HRM",
    department: "Human Resources",
    employeeCount: 4,
    status: "Active",
    level: "Manager",
  },
  {
    id: "5",
    name: "Business Development Executive",
    code: "BDE",
    department: "Business Development",
    employeeCount: 12,
    status: "Active",
    level: "Entry",
  },
  {
    id: "6",
    name: "Business Development Manager",
    code: "BDM",
    department: "Business Development",
    employeeCount: 6,
    status: "Active",
    level: "Manager",
  },
  {
    id: "7",
    name: "Medical Officer",
    code: "MO",
    department: "Medical Department",
    employeeCount: 8,
    status: "Active",
    level: "Senior",
  },
  {
    id: "8",
    name: "BPO Executive",
    code: "BPOE",
    department: "BPO",
    employeeCount: 20,
    status: "Active",
    level: "Entry",
  },
  {
    id: "9",
    name: "BPO Team Lead",
    code: "BPOTL",
    department: "BPO",
    employeeCount: 5,
    status: "Active",
    level: "Lead",
  },
];

const STATUS_ORDER: Record<Designation["status"], number> = {
  Active: 1,
  "Under Review": 2,
  Inactive: 3,
};

const columns: Column<Designation>[] = [
  {
    key: "name",
    header: "Designation",
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-purple-700 text-sm shrink-0">
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
    key: "department",
    header: "Department",
    accessor: (row) => (
      <span className="text-sm text-stone-700">{row.department}</span>
    ),
    sortValue: (row) => row.department,
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

export default function DesignationPage() {
  const [designations, setDesignations] = React.useState(initialDesignations);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingDesignation, setEditingDesignation] =
    React.useState<Designation | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [designationToDelete, setDesignationToDelete] =
    React.useState<Designation | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const departmentFilter = useMultiFilter(designations, (d) => d.department);
  const levelFilter = useMultiFilter(designations, (d) => d.level);
  const statusFilter = useMultiFilter(designations, (d) => d.status);
  const uniqueDepartments = React.useMemo(
    () => Array.from(new Set(designations.map((d) => d.department))),
    [designations],
  );

  const filteredData = React.useMemo(
    () =>
      designations
        .filter(
          (row) =>
            departmentFilter.matches(row) &&
            levelFilter.matches(row) &&
            statusFilter.matches(row),
        )
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [designations, departmentFilter, levelFilter, statusFilter],
  );

  const handleAdd = () => {
    setEditingDesignation(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (designation: Designation) => {
    setEditingDesignation(designation);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (designation: Designation) => {
    setDesignationToDelete(designation);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!designationToDelete) return;

    setIsDeleting(true);
    setTimeout(() => {
      setDesignations((prev) =>
        prev.filter((d) => d.id !== designationToDelete.id),
      );
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
      setDesignationToDelete(null);
    }, 1500);
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setDesignationToDelete(null);
  };

  const handleSave = (data: Omit<Designation, "id"> & { id?: string }) => {
    if (data.id) {
      setDesignations((prev) =>
        prev.map((d) =>
          d.id === data.id
            ? {
                ...d,
                name: data.name,
                code: data.code,
                department: data.department,
                employeeCount: data.employeeCount,
                status: data.status,
                level: data.level,
              }
            : d,
        ),
      );
    } else {
      // Add mode
      const newDesignation: Designation = {
        id: String(Date.now()),
        name: data.name,
        code: data.code,
        department: data.department,
        employeeCount: data.employeeCount,
        status: data.status,
        level: data.level,
      };
      setDesignations((prev) => [...prev, newDesignation]);
    }
    setIsAddDialogOpen(false);
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
              Designation Management
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAdd}
              aria-label="Add"
              className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Designation</span>
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
      </div>

      <div className="w-full px-3 sm:px-6 lg:px-8 py-4">
        <DataTable
          data={filteredData}
          columns={columns}
          keyExtractor={(row: { id: any }) => row.id}
          searchKeys={["name", "code", "department"]}
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
          onEditRow={handleEdit}
          onDeleteRow={handleDelete}
        />
      </div>

      <AddDesignation
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleSave}
        designation={editingDesignation}
        departments={uniqueDepartments}
      />

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteAlertOpen(false);
            setDesignationToDelete(null);
          }
        }}
        title="Delete Designation"
        description={`Are you sure you want to delete "${designationToDelete?.name || "Designation"}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}
