"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import {
  Column,
  DataTable,
  FilterPill,
  StatusPill,
} from "@/src/components/ui/Datatable";
import { ArrowLeft, Plus } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { AddDesignation } from "../components/AddDesignation";

import { usePermission } from "@/src/hooks/usePermission";
import { departmentService, type DepartmentDto } from "@/src/lib/departments/department.service";
import { parseApiError } from "@/src/lib/api/errors";
import {
  designationService,
  type DesignationDto,
  type DesignationPayload,
} from "@/src/lib/designations/designation.service";
import { MENU_MODULES } from "@/src/permissions/permissions";

const STATUS_ORDER: Record<DesignationDto["status"], number> = {
  Active: 1,
  "Under Review": 2,
  Inactive: 3,
};

const columns: Column<DesignationDto>[] = [
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
      <span className="text-sm text-stone-700">{row.department?.name ?? "—"}</span>
    ),
    sortValue: (row) => row.department?.name ?? "",
  },
  {
    key: "level",
    header: "Level",
    accessor: (row) => <span className="text-sm text-stone-700">{row.level}</span>,
    sortValue: (row) => row.level,
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
  // GET /api/menus only exposes view/edit/delete per module - no "create"
  // flag exists, so the Add button is left ungated (see phase report).
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.DESIGNATIONS);

  const [designations, setDesignations] = useState<DesignationDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingDesignation, setEditingDesignation] = React.useState<DesignationDto | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFormError, setSaveFormError] = React.useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = React.useState<Record<string, string>>({});

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [designationToDelete, setDesignationToDelete] = React.useState<DesignationDto | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const departmentFilter = useMultiFilter(designations, (d) => d.department?.name ?? "");
  const levelFilter = useMultiFilter(designations, (d) => d.level);
  const statusFilter = useMultiFilter(designations, (d) => d.status);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Designations depend on the real Department list for the
      // create/edit dropdown - fetched from the same verified endpoint
      // used by the Departments page, not hardcoded.
      const [designationData, departmentData] = await Promise.all([
        designationService.list(),
        departmentService.list(),
      ]);
      setDesignations(designationData);
      setDepartments(departmentData);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load designations.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

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
    setSaveFormError(null);
    setSaveFieldErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEdit = (designation: DesignationDto) => {
    setEditingDesignation(designation);
    setSaveFormError(null);
    setSaveFieldErrors({});
    setIsAddDialogOpen(true);
  };

  const handleDelete = (designation: DesignationDto) => {
    setDesignationToDelete(designation);
    setDeleteError(null);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!designationToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await designationService.remove(designationToDelete.id);
      setSuccessMessage("Designation deleted successfully.");
      setIsDeleteAlertOpen(false);
      setDesignationToDelete(null);
      await loadData();
    } catch (err) {
      // Dependency-protection (409) and other backend errors are shown
      // in place, not silently bypassed.
      setDeleteError(parseApiError(err, "Failed to delete designation.").message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setDesignationToDelete(null);
    setDeleteError(null);
  };

  const handleSave = async (payload: DesignationPayload) => {
    setIsSaving(true);
    setSaveFormError(null);
    setSaveFieldErrors({});
    try {
      if (editingDesignation) {
        await designationService.update(editingDesignation.id, payload);
        setSuccessMessage("Designation updated successfully.");
      } else {
        await designationService.create(payload);
        setSuccessMessage("Designation created successfully.");
      }
      setIsAddDialogOpen(false);
      setEditingDesignation(null);
      await loadData();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to save designation.");
      if (Object.keys(fieldErrors).length > 0) {
        setSaveFieldErrors(fieldErrors);
      } else {
        setSaveFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2]">
      <div className="sticky top-0 z-50 bg-[#F2F2F2] py-4 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-3 items-center min-w-0">
            <button type="button" aria-label="Go back"
              className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
            </button>
            <h1 className="text-lg sm:text-2xl font-light truncate">
              Designation Management
            </h1>
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
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 grid gap-4">
        {successMessage && <InlineBanner type="success" message={successMessage} />}
        {loadError && <InlineBanner type="error" message={loadError} />}

        <DataTable
          data={filteredData}
          columns={columns}
          exportFilename="designations"
          exportColumns={[
            { header: "Code", value: (r) => r.code },
            { header: "Designation", value: (r) => r.name },
            { header: "Department", value: (r) => r.department?.name },
            { header: "Level", value: (r) => r.level },
            { header: "Status", value: (r) => r.status },
            { header: "Description", value: (r) => r.description },
          ]}
          keyExtractor={(row) => row.id}
          searchKeys={["name", "code"]}
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
          isLoading={isLoading}
          emptyMessage="No designations found."
          onEditRow={canEdit ? handleEdit : undefined}
          onDeleteRow={canDelete ? handleDelete : undefined}
        />
      </div>

      <AddDesignation
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingDesignation(null);
        }}
        onSave={handleSave}
        designation={editingDesignation}
        departments={departments}
        isSaving={isSaving}
        serverErrors={saveFieldErrors}
        formError={saveFormError}
      />

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteAlertOpen(false);
            setDesignationToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Designation"
        description={
          deleteError ||
          `Are you sure you want to delete "${designationToDelete?.name || "Designation"}"? This action cannot be undone.`
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
