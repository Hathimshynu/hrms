"use client";

import { formatDate } from "@/src/lib/date/format";
import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Avatar, Column, DataTable, StatusPill } from "@/src/components/ui/Datatable";
import { Select } from "@/src/components/ui/Select";
import { ArrowLeft, Plus, Search, Upload } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { AddEmployee } from "./components/AddEmployee/AddEmployee";
import { EditEmployeeForm } from "./components/EditEmployeeForm";
import { ViewEmployee } from "./components/ViewEmployee";

import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import { departmentService, type DepartmentDto } from "@/src/lib/departments/department.service";
import { designationService, type DesignationDto } from "@/src/lib/designations/designation.service";
import {
  employeeService,
  type EmployeeListItem,
} from "@/src/lib/employees/employee.service";
import { MENU_MODULES } from "@/src/permissions/permissions";

const PAGE_SIZE = 20;

// employment_status enum, hrms-backend employees migration.
const STATUS_OPTIONS = [
  { label: "Onboarding", value: "Onboarding" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Invited", value: "Invited" },
  { label: "On Leave", value: "On Leave" },
  { label: "Terminated", value: "Terminated" },
];

const columns: Column<EmployeeListItem>[] = [
  {
    key: "name",
    header: "Name",
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.name} />
        <div className="min-w-0">
          <span className="font-medium text-stone-800 block truncate">{row.name}</span>
          <span className="text-xs text-gray-500 block">{row.employee_code}</span>
        </div>
      </div>
    ),
    sortValue: (row) => row.name,
    hideable: false,
  },
  { key: "jobTitle", header: "Job title", accessor: (row) => row.job_title || "—" },
  {
    key: "department",
    header: "Department",
    accessor: (row) => row.department?.name || "—",
  },
  {
    key: "branch",
    header: "Branch",
    accessor: (row) => row.branch?.name || "—",
  },
  {
    key: "joining_date",
    header: "Joined date",
    accessor: (row) => formatDate(row.joining_date),
    sortValue: (row) => row.joining_date ?? "",
  },
  { key: "lifecycle", header: "Lifecycle", accessor: (row) => row.lifecycle },
  {
    key: "status",
    header: "Status",
    accessor: (row) => <StatusPill status={row.status} />,
  },
];

export default function PeoplePage() {
  // GET /api/menus only exposes view/edit/delete per module - no "create"
  // flag exists, so the Add button is left ungated (see Phase 2/3 reports).
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.EMPLOYEES);
  const { view: canViewDepartments } = usePermission(MENU_MODULES.DEPARTMENTS);

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [designationId, setDesignationId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [designations, setDesignations] = useState<DesignationDto[]>([]);

  const [editingEmployee, setEditingEmployee] = React.useState<EmployeeListItem | null>(null);
  const [viewingEmployeeId, setViewingEmployeeId] = React.useState<number | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<EmployeeListItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce the free-text search before it drives a server request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // The department filter list needs `view departments`; skip it (avoiding a 403) otherwise.
  useEffect(() => {
    if (!canViewDepartments) return;
    departmentService.list().then(setDepartments).catch(() => {});
  }, [canViewDepartments]);

  useEffect(() => {
    if (!departmentId) {
      setDesignations([]);
      return;
    }
    designationService
      .list({ department_id: Number(departmentId) })
      .then(setDesignations)
      .catch(() => setDesignations([]));
  }, [departmentId]);

  const loadEmployees = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await employeeService.list({
        search: search || undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
        designation_id: designationId ? Number(designationId) : undefined,
        status: status || undefined,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setEmployees(result.data);
      setLastPage(result.last_page);
      setTotal(result.total);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load employees.").message);
    } finally {
      setIsLoading(false);
    }
  }, [search, departmentId, designationId, status, currentPage]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleView = (person: EmployeeListItem) => {
    setViewingEmployeeId(person.id);
    setIsViewDrawerOpen(true);
  };

  const handleEdit = (person: EmployeeListItem) => {
    setEditingEmployee(person);
    setIsEditDrawerOpen(true);
  };

  const handleDeleteClick = (person: EmployeeListItem) => {
    setEmployeeToDelete(person);
    setDeleteError(null);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await employeeService.remove(employeeToDelete.id);
      setSuccessMessage("Employee deleted successfully.");
      setIsDeleteAlertOpen(false);
      setEmployeeToDelete(null);
      await loadEmployees();
    } catch (err) {
      setDeleteError(parseApiError(err, "Failed to delete employee.").message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setEmployeeToDelete(null);
    setDeleteError(null);
  };

  const departmentOptions = departments.map((d) => ({ label: d.name, value: String(d.id) }));
  const designationOptions = designations.map((d) => ({ label: d.name, value: String(d.id) }));

  return (
    <div className="min-h-screen w-full py-4 px-3 sm:px-8 bg-[#F2F2F2] grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 items-center">
          <button type="button" aria-label="Go back"
            className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </button>

          <h1 className="text-lg sm:text-2xl font-light">Employee Management</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAddDrawerOpen(true)}
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

      {successMessage && <InlineBanner type="success" message={successMessage} />}
      {loadError && <InlineBanner type="error" message={loadError} />}

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, code, email, phone"
            aria-label="Search employees"
            className="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary-soft"
          />
        </div>

        <div className="w-full sm:w-52">
          <Select
            placeholder="All departments"
            options={departmentOptions}
            value={departmentId}
            clearable
            onChange={(value) => {
              setDepartmentId((value as string) || "");
              setDesignationId("");
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="w-full sm:w-52">
          <Select
            placeholder="All designations"
            options={designationOptions}
            value={designationId}
            clearable
            disabled={!departmentId}
            onChange={(value) => {
              setDesignationId((value as string) || "");
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            value={status}
            clearable
            onChange={(value) => {
              setStatus((value as string) || "");
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <DataTable
          data={employees}
          columns={columns}
          keyExtractor={(row) => row.id}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          emptyMessage="No employees found."
          onViewRow={handleView}
          onEditRow={canEdit ? handleEdit : undefined}
          onDeleteRow={canDelete ? handleDeleteClick : undefined}
        />

        {!isLoading && total > 0 && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {currentPage} of {lastPage} · {total} employee{total === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage >= lastPage}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AddEmployee
        isOpen={isAddDrawerOpen}
        setIsOpen={setIsAddDrawerOpen}
        onCompleted={(result) => {
          setSuccessMessage(
            result?.emailSent === false
              ? "Employee onboarding completed, but the welcome email could not be delivered. Ask an administrator to reset this account's password."
              : "Employee onboarding completed successfully."
          );
          loadEmployees();
        }}
      />

      <EditEmployeeForm
        isOpen={isEditDrawerOpen}
        setIsOpen={setIsEditDrawerOpen}
        employeeId={editingEmployee?.id ?? null}
        onSaved={() => {
          setSuccessMessage("Employee updated successfully.");
          loadEmployees();
        }}
      />

      <ViewEmployee
        isOpen={isViewDrawerOpen}
        setIsOpen={setIsViewDrawerOpen}
        employeeId={viewingEmployeeId}
      />

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteAlertOpen(false);
            setEmployeeToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Employee"
        description={
          deleteError ||
          `Are you sure you want to delete "${employeeToDelete?.name || "Employee"}"? This action cannot be undone.`
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}
