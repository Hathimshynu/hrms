"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import { getTodayIST } from "@/src/lib/date/format";
import {
  leaveEntitlementService,
  type LeaveEntitlementOptions,
  type LeaveEntitlementParams,
  type LeaveEntitlementRow,
  type Paginated,
} from "@/src/lib/leave-entitlements/leave-entitlement.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { DataGrid, Empty, Pager, Skeleton, type Column } from "../../reports/components/ReportPanels";
import { MasterPageShell } from "../components/MasterPageShell";
import { EntitlementFormDialog } from "./components/EntitlementFormDialog";

const PER_PAGE = 20;
const n = (v: number) => String(Number.isInteger(v) ? v : Number(v.toFixed(2)));

export default function LeaveEntitlementsPage() {
  const access = usePermission(MENU_MODULES.LEAVE_ENTITLEMENTS);
  const canCreate = usePermission(MENU_MODULES.LEAVE_ENTITLEMENTS_CREATE).view;

  const currentYear = Number(getTodayIST().slice(0, 4));
  const yearOptions = React.useMemo(() => [currentYear - 2, currentYear - 1, currentYear, currentYear + 1], [currentYear]);

  const [year, setYear] = React.useState(String(currentYear));
  const [departmentId, setDepartmentId] = React.useState("");
  const [policyId, setPolicyId] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<"leave_year" | "entitled_days">("leave_year");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const [options, setOptions] = React.useState<LeaveEntitlementOptions | null>(null);
  const [result, setResult] = React.useState<Paginated<LeaveEntitlementRow> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LeaveEntitlementRow | null>(null);
  const [toDelete, setToDelete] = React.useState<LeaveEntitlementRow | null>(null);
  const [deleteError, setDeleteError] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  // Radix closes the alert as soon as Delete is clicked; the ref (set synchronously) keeps it open so a server error can be shown.
  const deletingRef = React.useRef(false);

  // Server-side search is debounced so typing does not fire a request per keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  React.useEffect(() => {
    let alive = true;
    leaveEntitlementService
      .options()
      .then((o) => alive && setOptions(o))
      .catch(() => alive && setOptions(null));
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    const params: LeaveEntitlementParams = { page, per_page: PER_PAGE, sort_by: sortBy, sort_dir: sortDir };
    if (year) params.year = Number(year);
    if (departmentId) params.department_id = Number(departmentId);
    if (policyId) params.leave_policy_id = Number(policyId);
    if (search) params.search = search;

    /* eslint-disable react-hooks/set-state-in-effect */
    setIsLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    leaveEntitlementService
      .list(params, controller.signal)
      .then((r) => {
        setResult(r);
        setIsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(parseApiError(err, "Failed to load leave entitlements.").message);
        setIsLoading(false);
      });
    return () => controller.abort();
  }, [year, departmentId, policyId, search, page, sortBy, sortDir, tick]);

  const reload = () => setTick((t) => t + 1);

  const onSort = (key: string) => {
    if (key !== "leave_year" && key !== "entitled_days") return;
    if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!toDelete || deletingRef.current) return;
    deletingRef.current = true;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await leaveEntitlementService.remove(toDelete.id);
      setToDelete(null);
      setNotice(res.message ?? "Leave entitlement deleted.");
      reload();
    } catch (err) {
      setDeleteError(parseApiError(err, "Could not delete the leave entitlement.").message);
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const columns: Column<LeaveEntitlementRow>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <span>
          <span className="font-medium">{r.employee_name}</span>
          {r.employee_code && <span className="block text-xs text-muted">{r.employee_code}</span>}
        </span>
      ),
    },
    { key: "department", header: "Department", render: (r) => r.department ?? "—" },
    { key: "type", header: "Leave type", render: (r) => r.leave_type_name ?? r.leave_type ?? "—" },
    { key: "year", header: "Year", sortKey: "leave_year", render: (r) => r.leave_year },
    { key: "entitled", header: "Entitlement", sortKey: "entitled_days", align: "right", render: (r) => n(r.entitled_days) },
    { key: "approved", header: "Approved", align: "right", render: (r) => n(r.approved_days) },
    { key: "pending", header: "Pending", align: "right", render: (r) => n(r.pending_days) },
    { key: "remaining", header: "Remaining", align: "right", render: (r) => n(r.remaining_days) },
  ];

  if (access.edit || access.delete) {
    columns.push({
      key: "actions",
      header: "Actions",
      render: (r) => (
        <span className="flex gap-1">
          {access.edit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Edit ${r.leave_type_name ?? r.leave_type} ${r.leave_year} entitlement for ${r.employee_name}`}
              onClick={() => {
                setEditing(r);
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {access.delete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Delete ${r.leave_type_name ?? r.leave_type} ${r.leave_year} entitlement for ${r.employee_name}`}
              onClick={() => {
                setDeleteError("");
                setToDelete(r);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
            </Button>
          )}
        </span>
      ),
    });
  }

  return (
    <MasterPageShell
      title="Leave Entitlements"
      note="Days allocated to each employee per leave type and year. Approved and pending days come from leave requests; remaining = entitled − approved."
      successMessage={notice}
      errorMessage={error}
    >
      <section aria-label="Filters" className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-5">
        <Input
          label="Search employee"
          type="search"
          placeholder="Name or employee code"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          label="Year"
          placeholder="All years"
          options={yearOptions.map((y) => ({ label: String(y), value: String(y) }))}
          value={year}
          onChange={(v) => {
            setYear((v as string) || "");
            setPage(1);
          }}
        />
        <Select
          label="Department"
          placeholder="All departments"
          options={(options?.departments ?? []).map((d) => ({ label: d.name, value: String(d.id) }))}
          value={departmentId}
          onChange={(v) => {
            setDepartmentId((v as string) || "");
            setPage(1);
          }}
        />
        <Select
          label="Leave type"
          placeholder="All leave types"
          options={(options?.leave_policies ?? []).map((p) => ({ label: p.name, value: String(p.id) }))}
          value={policyId}
          onChange={(v) => {
            setPolicyId((v as string) || "");
            setPage(1);
          }}
        />
        {canCreate && (
          <div className="flex items-end">
            <Button
              type="button"
              fullWidth
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add entitlement
            </Button>
          </div>
        )}
      </section>

      <div aria-busy={isLoading} className="grid gap-3">
        {isLoading && !result ? (
          <Skeleton />
        ) : error && !result ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface py-10 text-center">
            <p className="text-sm text-ink-soft">Leave entitlements could not be loaded.</p>
            <Button type="button" variant="outline" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        ) : result && result.data.length === 0 && !isLoading ? (
          <Empty
            message={
              search || departmentId || policyId
                ? "No leave entitlements match these filters."
                : `No leave entitlements are configured${year ? ` for ${year}` : ""} yet. Employees cannot apply for leave of a type until an entitlement exists.`
            }
          />
        ) : (
          result && (
            <>
              <DataGrid
                caption="Leave entitlements"
                columns={columns}
                rows={result.data}
                rowKey={(r) => r.id}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <Pager page={result.current_page} lastPage={result.last_page} onPage={setPage} busy={isLoading} />
              <p className="text-xs text-muted">{result.total} entitlement{result.total === 1 ? "" : "s"}</p>
            </>
          )
        )}
      </div>

      <EntitlementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        options={options}
        defaultYear={year ? Number(year) : currentYear}
        yearOptions={yearOptions}
        onSaved={(m) => {
          setNotice(m);
          reload();
        }}
      />

      <DeleteAlert
        open={toDelete !== null}
        onOpenChange={(o) => {
          if (!o && !deletingRef.current) setToDelete(null);
        }}
        title="Delete leave entitlement"
        description={
          deleteError ||
          `Delete the ${toDelete?.leave_type_name ?? toDelete?.leave_type ?? ""} ${toDelete?.leave_year ?? ""} entitlement for ${toDelete?.employee_name ?? "this employee"}? This cannot be undone.`
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => !deletingRef.current && setToDelete(null)}
        loading={isDeleting}
      />
    </MasterPageShell>
  );
}
