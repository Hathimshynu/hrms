"use client";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import {
  permissionService,
  type PermissionGroup,
} from "@/src/lib/permissions/permission.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { roleService, type RoleDto } from "@/src/lib/roles/role.service";
import {
  ArrowLeft,
  ChevronDown,
  KeyRound,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function setsEqual(a: Set<number>, b: Set<number>) {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

interface RolePermissionsPageProps {
  params: Promise<{ id: string }>;
}

export default function RolePermissionsPage({ params }: RolePermissionsPageProps) {
  const { id } = React.use(params);
  const roleId = Number(id);
  const router = useRouter();

  // GET /api/menus gates view/edit/delete for the "roles" module all by
  // the same backend permission (`manage roles`) - see MenuController - so
  // there is no meaningful read-only-vs-edit distinction to build here.
  // AuthGuard already blocks the whole route for users without view
  // access; this only needs to gate the ability to change/save.
  const { edit: canEdit } = usePermission(MENU_MODULES.ROLES);

  const [role, setRole] = React.useState<RoleDto | null>(null);
  const [groups, setGroups] = React.useState<PermissionGroup[]>([]);
  const [initialSelected, setInitialSelected] = React.useState<Set<number>>(new Set());
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [openModules, setOpenModules] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [roleData, groupedData, rolePermissions] = await Promise.all([
        roleService.get(roleId),
        permissionService.grouped(),
        roleService.getPermissions(roleId),
      ]);

      const assigned = new Set(rolePermissions.permissions.map((p) => p.id));

      setRole(roleData);
      setGroups(groupedData);
      setInitialSelected(assigned);
      setSelected(new Set(assigned));
      setOpenModules(new Set(groupedData.map((g) => g.module)));
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load role permissions.").message);
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  React.useEffect(() => {
    if (!Number.isFinite(roleId)) {
      setLoadError("Invalid role.");
      setIsLoading(false);
      return;
    }
    loadData();
  }, [roleId, loadData]);

  React.useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const totalPermissions = React.useMemo(
    () => groups.reduce((sum, g) => sum + g.permissions.length, 0),
    [groups],
  );

  const filteredGroups = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter((p) => p.name.toLowerCase().includes(q)),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [groups, search]);

  const isSearching = search.trim().length > 0;
  const isDirty = !setsEqual(selected, initialSelected);

  const togglePermission = (permissionId: number) => {
    if (!canEdit) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(permissionId) ? next.delete(permissionId) : next.add(permissionId);
      return next;
    });
  };

  const toggleModule = (module: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  };

  const toggleModuleSelectAll = (group: PermissionGroup) => {
    if (!canEdit) return;
    const ids = group.permissions.map((p) => p.id);
    const allSelected = ids.every((permissionId) => selected.has(permissionId));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((permissionId) =>
        allSelected ? next.delete(permissionId) : next.add(permissionId),
      );
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!canEdit) return;
    const all = new Set<number>();
    groups.forEach((g) => g.permissions.forEach((p) => all.add(p.id)));
    setSelected(all);
  };

  const handleClearAll = () => {
    if (!canEdit) return;
    setSelected(new Set());
  };

  const handleReset = () => {
    setSelected(new Set(initialSelected));
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!canEdit || !isDirty) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await roleService.syncPermissions(roleId, Array.from(selected));
      const nextSelected = new Set(result.permissions.map((p) => p.id));
      setInitialSelected(nextSelected);
      setSelected(nextSelected);
      setSuccessMessage("Role permissions updated successfully.");
    } catch (err) {
      setSaveError(parseApiError(err, "Failed to update role permissions.").message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full py-4 px-3 sm:px-6 lg:px-8 bg-[#F2F2F2] grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 items-center min-w-0">
          <div
            className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => router.push("/access-control/roles")}
            aria-label="Back to roles"
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-2xl font-light truncate flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              {isLoading ? "Manage Permissions" : `Manage Permissions — ${role?.name ?? "Role"}`}
            </div>
            <p className="text-sm text-muted mt-0.5">
              Select the permissions this role should have, grouped by module.
            </p>
          </div>
        </div>

        {!isLoading && !loadError && (
          <div className="flex items-center gap-2 shrink-0">
            {isDirty && (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                Unsaved changes
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
            >
              <Undo2 className="h-4 w-4" />
              Reset
            </Button>
            {canEdit && (
              <Button type="button" size="md" onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        )}
      </div>

      {successMessage && <InlineBanner type="success" message={successMessage} />}
      {saveError && <InlineBanner type="error" message={saveError} />}
      {loadError && <InlineBanner type="error" message={loadError} />}

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : loadError ? null : (
        <>
          <div className="w-full rounded-xl bg-surface p-3 sm:p-4 shadow-sm border flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permissions by name..."
                className="pl-10"
              />
            </div>

            <span className="text-sm font-medium text-muted whitespace-nowrap">
              {selected.size} of {totalPermissions} permissions selected
            </span>

            {canEdit && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                >
                  Select all
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-sm font-semibold text-muted hover:text-red-600 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            {filteredGroups.length === 0 ? (
              <div className="w-full rounded-xl bg-surface p-8 text-center text-sm text-muted shadow-sm border">
                No permissions match your search.
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isOpen = isSearching || openModules.has(group.module);
                const moduleIds = group.permissions.map((p) => p.id);
                const selectedInModule = moduleIds.filter((moduleId) =>
                  selected.has(moduleId),
                ).length;
                const allModuleSelected =
                  moduleIds.length > 0 && selectedInModule === moduleIds.length;
                const someModuleSelected =
                  selectedInModule > 0 && selectedInModule < moduleIds.length;

                return (
                  <div
                    key={group.module}
                    className="w-full rounded-xl bg-surface shadow-sm border overflow-hidden"
                  >
                    <Collapsible
                      open={isOpen}
                      disabled={isSearching}
                      onOpenChange={() => toggleModule(group.module)}
                    >
                      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-surface-muted/60">
                        <CollapsibleTrigger
                          disabled={isSearching}
                          className="flex flex-1 min-w-0 cursor-pointer items-center gap-2.5 text-left disabled:cursor-default"
                        >
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                          <span className="font-semibold text-ink truncate">
                            {titleCase(group.module)}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              selectedInModule > 0
                                ? "bg-primary/10 text-primary"
                                : "bg-surface text-muted"
                            }`}
                          >
                            {selectedInModule}/{moduleIds.length}
                          </span>
                        </CollapsibleTrigger>

                        <label
                          className="flex shrink-0 items-center gap-2 cursor-pointer select-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={allModuleSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someModuleSelected;
                            }}
                            onChange={() => toggleModuleSelectAll(group)}
                            disabled={!canEdit}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                          />
                          <span className="text-xs font-medium text-muted whitespace-nowrap">
                            Select all
                          </span>
                        </label>
                      </div>

                      <CollapsibleContent>
                        <div className="grid grid-cols-1 gap-2 px-4 sm:px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
                          {group.permissions.map((permission) => (
                            <label
                              key={permission.id}
                              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                                selected.has(permission.id)
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border bg-[#F9F9F9]"
                              } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                              title={permission.name}
                            >
                              <input
                                type="checkbox"
                                checked={selected.has(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                disabled={!canEdit}
                                className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                              />
                              <span className="min-w-0 flex-1 truncate font-medium text-ink">
                                {titleCase(permission.action)}
                              </span>
                              <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted" />
                            </label>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
