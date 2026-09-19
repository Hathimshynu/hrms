"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import {
  Column,
  DataTable,
  FilterPill,
  StatusPill,
} from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import {
  departmentService,
  type DepartmentDto,
  type DepartmentPayload,
} from "@/src/lib/departments/department.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { AddDepartment } from "../components/AddDepartment";

const STATUS_ORDER: Record<DepartmentDto["status"], number> = {
  Active: 1,
  "Under Review": 2,
  Inactive: 3,
};

const columns: Column<DepartmentDto>[] = [
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
  {
    key: "description",
    header: "Description",
    accessor: (row) => (
      <span className="text-sm text-gray-500 line-clamp-1">
        {row.description || "—"}
      </span>
    ),
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

export default function DepartmentsPage() {
  // GET /api/menus only exposes view/edit/delete per module - no "create"
  // flag exists, so the Add button is left ungated (per Phase 2/3 scope).
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.DEPARTMENTS);

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingDepartment, setEditingDepartment] = React.useState<DepartmentDto | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFormError, setSaveFormError] = React.useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = React.useState<Record<string, string>>({});

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [departmentToDelete, setDepartmentToDelete] = React.useState<DepartmentDto | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const typeFilter = useMultiFilter(departments, (d) => d.type);
  const statusFilter = useMultiFilter(departments, (d) => d.status);

  const loadDepartments = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await departmentService.list();
      setDepartments(data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load departments.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const filteredData = React.useMemo(
    () =>
      departments
        .filter((row) => typeFilter.matches(row) && statusFilter.matches(row))
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [departments, typeFilter, statusFilter],
  );

  const handleSave = async (payload: DepartmentPayload) => {
    setIsSaving(true);
    setSaveFormError(null);
    setSaveFieldErrors({});
    try {
      if (editingDepartment) {
        await departmentService.update(editingDepartment.id, payload);
        setSuccessMessage("Department updated successfully.");
      } else {
        await departmentService.create(payload);
        setSuccessMessage("Department created successfully.");
      }
      setIsAddDrawerOpen(false);
      setIsEditDrawerOpen(false);
      setEditingDepartment(null);
      await loadDepartments();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to save department.");
      if (Object.keys(fieldErrors).length > 0) {
        setSaveFieldErrors(fieldErrors);
      } else {
        setSaveFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (department: DepartmentDto) => {
    setEditingDepartment(department);
    setSaveFormError(null);
    setSaveFieldErrors({});
    setIsEditDrawerOpen(true);
  };

  const handleDelete = (department: DepartmentDto) => {
    setDepartmentToDelete(department);
    setDeleteError(null);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await departmentService.remove(departmentToDelete.id);
      setSuccessMessage("Department deleted successfully.");
      setIsDeleteAlertOpen(false);
      setDepartmentToDelete(null);
      await loadDepartments();
    } catch (err) {
      // Dependency-protection (409) and other backend errors are shown
      // in place, not silently bypassed.
      setDeleteError(parseApiError(err, "Failed to delete department.").message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setDepartmentToDelete(null);
    setDeleteError(null);
  };

  return (
    <div className="min-h-screen w-full py-4 px-3 sm:px-6 lg:px-8 bg-[#F2F2F2] grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 items-center min-w-0">
          <button type="button" aria-label="Go back"
            className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </button>
          <h1 className="text-lg sm:text-2xl font-light truncate">
            Department Management
          </h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setEditingDepartment(null);
              setSaveFormError(null);
              setSaveFieldErrors({});
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

      {successMessage && <InlineBanner type="success" message={successMessage} />}
      {loadError && <InlineBanner type="error" message={loadError} />}

      <div className="w-full">
        <DataTable
          data={filteredData}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchKeys={["name", "code"]}
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
          isLoading={isLoading}
          emptyMessage="No departments found."
          onEditRow={canEdit ? handleEdit : undefined}
          onDeleteRow={canDelete ? handleDelete : undefined}
        />
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
        isSaving={isSaving}
        serverErrors={saveFieldErrors}
        formError={saveFormError}
      />

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteAlertOpen(false);
            setDepartmentToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Department"
        description={
          deleteError ||
          `Are you sure you want to delete "${departmentToDelete?.name || "Department"}"? This action cannot be undone.`
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
