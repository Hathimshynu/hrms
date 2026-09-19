"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Column, DataTable, FilterPill } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import {
  permissionService,
  type PermissionDto,
  type PermissionPayload,
} from "@/src/lib/permissions/permission.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { ArrowLeft, KeyRound, Plus } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { AddPermission } from "../components/AddPermission";

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const columns: Column<PermissionDto>[] = [
  {
    key: "name",
    header: "Permission",
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
          <KeyRound className="h-4 w-4" />
        </div>
        <span className="font-medium text-stone-800 truncate block">{row.name}</span>
      </div>
    ),
    sortValue: (row) => row.name,
    hideable: false,
  },
  {
    key: "module",
    header: "Module",
    accessor: (row) => (
      <span className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 whitespace-nowrap">
        {titleCase(row.module)}
      </span>
    ),
    sortValue: (row) => row.module,
  },
  {
    key: "action",
    header: "Action",
    accessor: (row) => (
      <span className="inline-flex items-center rounded-md bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 whitespace-nowrap">
        {titleCase(row.action)}
      </span>
    ),
    sortValue: (row) => row.action,
  },
];

function useModuleFilter(data: PermissionDto[]) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const options = React.useMemo(
    () => Array.from(new Set(data.map((d) => d.module))).filter(Boolean).sort(),
    [data],
  );
  const toggle = (val: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  const clear = () => setSelected(new Set());
  const matches = (row: PermissionDto) => selected.size === 0 || selected.has(row.module);

  return { selected, options, toggle, clear, matches };
}

export default function PermissionsPage() {
  // GET /api/menus only exposes view/edit/delete per module - no "create"
  // flag exists, so the Add button is left ungated (per Phase 2/3 scope).
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.PERMISSIONS);

  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [moduleSuggestions, setModuleSuggestions] = useState<string[]>([]);

  const [editingPermission, setEditingPermission] = React.useState<PermissionDto | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFormError, setSaveFormError] = React.useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = React.useState<Record<string, string>>({});

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [permissionToDelete, setPermissionToDelete] = React.useState<PermissionDto | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const moduleFilter = useModuleFilter(permissions);

  const loadPermissions = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await permissionService.list();
      setPermissions(data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load permissions.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
    permissionService
      .modules()
      .then(setModuleSuggestions)
      .catch(() => {
        // Non-critical: only used for the Add/Edit dialog's module
        // suggestion list, so a failure here is silently ignored.
      });
  }, [loadPermissions]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const filteredData = React.useMemo(
    () => permissions.filter((row) => moduleFilter.matches(row)),
    [permissions, moduleFilter],
  );

  const handleSave = async (payload: PermissionPayload) => {
    setIsSaving(true);
    setSaveFormError(null);
    setSaveFieldErrors({});
    try {
      if (editingPermission) {
        await permissionService.update(editingPermission.id, payload);
        setSuccessMessage("Permission updated successfully.");
      } else {
        await permissionService.create(payload);
        setSuccessMessage("Permission created successfully.");
      }
      setIsAddDrawerOpen(false);
      setIsEditDrawerOpen(false);
      setEditingPermission(null);
      await loadPermissions();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to save permission.");
      if (Object.keys(fieldErrors).length > 0) {
        setSaveFieldErrors(fieldErrors);
      } else {
        setSaveFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (permission: PermissionDto) => {
    setEditingPermission(permission);
    setSaveFormError(null);
    setSaveFieldErrors({});
    setIsEditDrawerOpen(true);
  };

  const handleDelete = (permission: PermissionDto) => {
    setPermissionToDelete(permission);
    setDeleteError(null);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!permissionToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await permissionService.remove(permissionToDelete.id);
      setSuccessMessage("Permission deleted successfully.");
      setIsDeleteAlertOpen(false);
      setPermissionToDelete(null);
      await loadPermissions();
    } catch (err) {
      // "Permission cannot be deleted because it is assigned to one or
      // more roles." (422) and other backend errors are shown in place,
      // not silently bypassed.
      setDeleteError(parseApiError(err, "Failed to delete permission.").message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setPermissionToDelete(null);
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
          <h1 className="text-lg sm:text-2xl font-light truncate">Permission Management</h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setEditingPermission(null);
              setSaveFormError(null);
              setSaveFieldErrors({});
              setIsAddDrawerOpen(true);
            }}
            aria-label="Add"
            className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Permission</span>
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
          searchKeys={["name", "module", "action"]}
          searchPlaceholder="Search permissions..."
          filtersSlot={
            <FilterPill
              label="Module"
              options={moduleFilter.options}
              selected={moduleFilter.selected}
              onToggle={moduleFilter.toggle}
              onClear={moduleFilter.clear}
            />
          }
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="No permissions found."
          onEditRow={canEdit ? handleEdit : undefined}
          onDeleteRow={canDelete ? handleDelete : undefined}
        />
      </div>

      <AddPermission
        open={isAddDrawerOpen || isEditDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDrawerOpen(false);
            setIsEditDrawerOpen(false);
            setEditingPermission(null);
          }
        }}
        permission={isEditDrawerOpen ? editingPermission : null}
        onSave={handleSave}
        isSaving={isSaving}
        moduleSuggestions={moduleSuggestions}
        serverErrors={saveFieldErrors}
        formError={saveFormError}
      />

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteAlertOpen(false);
            setPermissionToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Permission"
        description={
          deleteError ||
          `Are you sure you want to delete "${permissionToDelete?.name || "Permission"}"? This action cannot be undone.`
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
