"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Column, DataTable } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import { roleService, type RoleDto, type RolePayload } from "@/src/lib/roles/role.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { ArrowLeft, KeyRound, Plus, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { AddRole } from "../components/AddRole";

const columns = (
  onManagePermissions: (role: RoleDto) => void,
): Column<RoleDto>[] => [
  {
    key: "name",
    header: "Role",
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <span className="font-medium text-stone-800 truncate block">{row.name}</span>
      </div>
    ),
    sortValue: (row) => row.name,
    hideable: false,
  },
  {
    key: "permissions_count",
    header: "Permissions",
    accessor: (row) => (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
        {row.permissions_count ?? row.permissions?.length ?? 0} assigned
      </span>
    ),
    sortValue: (row) => row.permissions_count ?? row.permissions?.length ?? 0,
  },
  {
    key: "manage",
    header: "Manage",
    sortable: false,
    accessor: (row) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onManagePermissions(row);
        }}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-white"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Manage Permissions
      </button>
    ),
  },
];

export default function RolesPage() {
  // GET /api/menus only exposes view/edit/delete per module - no "create"
  // flag exists, so the Add button is left ungated (per Phase 2/3 scope).
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.ROLES);
  const router = useRouter();

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingRole, setEditingRole] = React.useState<RoleDto | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFormError, setSaveFormError] = React.useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = React.useState<Record<string, string>>({});

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<RoleDto | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadRoles = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await roleService.list();
      setRoles(data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load roles.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleSave = async (payload: RolePayload) => {
    setIsSaving(true);
    setSaveFormError(null);
    setSaveFieldErrors({});
    try {
      if (editingRole) {
        await roleService.update(editingRole.id, payload);
        setSuccessMessage("Role updated successfully.");
      } else {
        await roleService.create(payload);
        setSuccessMessage("Role created successfully.");
      }
      setIsAddDrawerOpen(false);
      setIsEditDrawerOpen(false);
      setEditingRole(null);
      await loadRoles();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to save role.");
      if (Object.keys(fieldErrors).length > 0) {
        setSaveFieldErrors(fieldErrors);
      } else {
        setSaveFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (role: RoleDto) => {
    setEditingRole(role);
    setSaveFormError(null);
    setSaveFieldErrors({});
    setIsEditDrawerOpen(true);
  };

  const handleDelete = (role: RoleDto) => {
    setRoleToDelete(role);
    setDeleteError(null);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await roleService.remove(roleToDelete.id);
      setSuccessMessage("Role deleted successfully.");
      setIsDeleteAlertOpen(false);
      setRoleToDelete(null);
      await loadRoles();
    } catch (err) {
      // "Role cannot be deleted because users are assigned to this role."
      // (422) and other backend errors are shown in place, not silently
      // bypassed.
      setDeleteError(parseApiError(err, "Failed to delete role.").message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setRoleToDelete(null);
    setDeleteError(null);
  };

  const handleManagePermissions = (role: RoleDto) => {
    router.push(`/access-control/roles/${role.id}/permissions`);
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
          <h1 className="text-lg sm:text-2xl font-light truncate">Role Management</h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setEditingRole(null);
              setSaveFormError(null);
              setSaveFieldErrors({});
              setIsAddDrawerOpen(true);
            }}
            aria-label="Add"
            className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Role</span>
          </button>
        </div>
      </div>

      {successMessage && <InlineBanner type="success" message={successMessage} />}
      {loadError && <InlineBanner type="error" message={loadError} />}

      <div className="w-full">
        <DataTable
          data={roles}
          columns={columns(handleManagePermissions)}
          keyExtractor={(row) => row.id}
          searchKeys={["name"]}
          searchPlaceholder="Search roles..."
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="No roles found."
          onEditRow={canEdit ? handleEdit : undefined}
          onDeleteRow={canDelete ? handleDelete : undefined}
        />
      </div>

      <AddRole
        open={isAddDrawerOpen || isEditDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDrawerOpen(false);
            setIsEditDrawerOpen(false);
            setEditingRole(null);
          }
        }}
        role={isEditDrawerOpen ? editingRole : null}
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
            setRoleToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Role"
        description={
          deleteError ||
          `Are you sure you want to delete "${roleToDelete?.name || "Role"}"? This action cannot be undone.`
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
