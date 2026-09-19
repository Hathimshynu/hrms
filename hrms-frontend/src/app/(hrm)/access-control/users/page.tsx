"use client";

import { formatDateTime } from "@/src/lib/date/format";
import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import {
  Column,
  DataTable,
  FilterPill,
  StatusPill,
} from "@/src/components/ui/Datatable";
import { useAuth } from "@/src/hooks/useAuth";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import { roleService, type RoleDto } from "@/src/lib/roles/role.service";
import {
  userService,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserDto,
} from "@/src/lib/users/user.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { AddUser } from "./components/AddUser";

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

export default function UsersPage() {
  // GET /api/menus only exposes view/edit/delete per module - no "create"
  // flag exists, so the Add button is gated on `edit` (closest available
  // signal that this admin manages users), same limitation noted in
  // organization/departments/page.tsx.
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.USERS);
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = React.useState<UserDto | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFormError, setSaveFormError] = React.useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = React.useState<Record<string, string>>({});

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<UserDto | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const roleFilter = useMultiFilter(users, (u) => u.role?.name ?? "No role");
  const statusFilter = useMultiFilter(users, (u) => (u.is_active ? "Active" : "Inactive"));

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await userService.list();
      setUsers(result.data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load users.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    roleService
      .list()
      .then(setRoles)
      .catch(() => setRolesError("You don't have permission to view roles."));
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const filteredData = React.useMemo(
    () => users.filter((row) => roleFilter.matches(row) && statusFilter.matches(row)),
    [users, roleFilter, statusFilter],
  );

  const handleSave = async (payload: CreateUserPayload | UpdateUserPayload) => {
    setIsSaving(true);
    setSaveFormError(null);
    setSaveFieldErrors({});
    try {
      if (editingUser) {
        await userService.update(editingUser.id, payload as UpdateUserPayload);
        setSuccessMessage("User updated successfully.");
      } else {
        await userService.create(payload as CreateUserPayload);
        setSuccessMessage("User created successfully.");
      }
      setIsAddDrawerOpen(false);
      setIsEditDrawerOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err, "Failed to save user.");
      if (Object.keys(fieldErrors).length > 0) {
        setSaveFieldErrors(fieldErrors);
      } else {
        setSaveFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user: UserDto) => {
    setEditingUser(user);
    setSaveFormError(null);
    setSaveFieldErrors({});
    setIsEditDrawerOpen(true);
  };

  const handleDelete = (user: UserDto) => {
    setUserToDelete(user);
    setDeleteError(null);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await userService.remove(userToDelete.id);
      setSuccessMessage("User deleted successfully.");
      setIsDeleteAlertOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      // The backend blocks self-delete (409) and deletion of a user with a
      // linked Employee record (409) - both messages are surfaced as-is,
      // not treated as generic failures.
      setDeleteError(parseApiError(err, "Failed to delete user.").message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setUserToDelete(null);
    setDeleteError(null);
  };

  // A custom "Actions" column (rather than DataTable's built-in
  // onEditRow/onDeleteRow) so the Delete button can be hidden on the
  // currently logged-in user's own row - the backend already blocks
  // self-delete with a 409, but hiding the button avoids a confusing
  // error. DataTable's Column#accessor already supports arbitrary node
  // rendering, so this reuses it rather than adding a new prop to the
  // shared component.
  const columns = React.useMemo<Column<UserDto>[]>(() => {
    const cols: Column<UserDto>[] = [
      {
        key: "name",
        header: "Name",
        accessor: (row) => (
          <span className="font-medium text-stone-800">{row.name}</span>
        ),
        sortValue: (row) => row.name,
        hideable: false,
      },
      {
        key: "email",
        header: "Email",
        accessor: (row) => <span className="text-sm text-gray-600">{row.email}</span>,
        sortValue: (row) => row.email,
      },
      {
        key: "employee",
        header: "Employee",
        accessor: (row) =>
          row.employee ? (
            <div className="min-w-0">
              <span className="block truncate text-sm text-ink">{row.employee.name}</span>
              <span className="block text-xs text-muted">{row.employee.employee_code}</span>
            </div>
          ) : (
            <span className="text-sm text-muted">Not linked</span>
          ),
        sortValue: (row) => row.employee?.name ?? "",
      },
      {
        key: "role",
        header: "Role",
        accessor: (row) => (
          <span
            className={`p-2 rounded-md text-xs font-medium whitespace-nowrap ${
              row.role ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {row.role?.name ?? "No role"}
          </span>
        ),
        sortValue: (row) => row.role?.name ?? "",
      },
      {
        key: "is_active",
        header: "Status",
        accessor: (row) => <StatusPill status={row.is_active ? "Active" : "Inactive"} />,
        sortValue: (row) => (row.is_active ? "Active" : "Inactive"),
      },
      {
        key: "last_login_at",
        header: "Last Login",
        accessor: (row) => (
          <span className="text-sm text-gray-500">{row.last_login_at ? formatDateTime(row.last_login_at) : "Never"}</span>
        ),
        sortValue: (row) => row.last_login_at ?? "",
      },
    ];

    if (canEdit || canDelete) {
      cols.push({
        key: "actions",
        header: "Actions",
        sortable: false,
        hideable: false,
        accessor: (row) => {
          const isSelf = currentUser?.id === row.id;
          return (
            <div className="flex items-center justify-center gap-1.5">
              {canEdit && (
                <button
                  onClick={() => handleEdit(row)}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 cursor-pointer group"
                  aria-label="Edit"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </button>
              )}
              {canDelete && !isSelf && (
                <button
                  onClick={() => handleDelete(row)}
                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer group"
                  aria-label="Delete"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          );
        },
      });
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, canDelete, currentUser?.id]);

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
            User Access Management
          </h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canEdit && (
            <button
              onClick={() => {
                setEditingUser(null);
                setSaveFormError(null);
                setSaveFieldErrors({});
                setIsAddDrawerOpen(true);
              }}
              aria-label="Add"
              className="flex h-10 sm:h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 sm:px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add User</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && <InlineBanner type="success" message={successMessage} />}
      {loadError && <InlineBanner type="error" message={loadError} />}

      <div className="w-full">
        <DataTable
          data={filteredData}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchKeys={["name", "email"]}
          searchPlaceholder="Search by name or email..."
          filtersSlot={
            <>
              <FilterPill
                label="Role"
                options={roleFilter.options}
                selected={roleFilter.selected}
                onToggle={roleFilter.toggle}
                onClear={roleFilter.clear}
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
          emptyMessage="No users found."
        />
      </div>

      <AddUser
        open={isAddDrawerOpen || isEditDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDrawerOpen(false);
            setIsEditDrawerOpen(false);
            setEditingUser(null);
          }
        }}
        user={isEditDrawerOpen ? editingUser : null}
        roles={roles}
        rolesError={rolesError}
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
            setUserToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete User"
        description={
          deleteError ||
          `Are you sure you want to delete "${userToDelete?.name || "this user"}"? This action cannot be undone.`
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
