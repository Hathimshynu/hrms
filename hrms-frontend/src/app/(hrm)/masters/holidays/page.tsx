"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { StatusPill } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDate, getTodayIST } from "@/src/lib/date/format";
import { holidayService, type Holiday, type HolidayParams } from "@/src/lib/holidays/holiday.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { DataGrid, Empty, Skeleton, type Column } from "../../reports/components/ReportPanels";
import { MasterPageShell } from "../components/MasterPageShell";
import { HolidayFormDialog, weekdayOf } from "./components/HolidayFormDialog";

export default function HolidaysPage() {
  const access = usePermission(MENU_MODULES.HOLIDAYS);
  const canCreate = usePermission(MENU_MODULES.HOLIDAYS_CREATE).view;

  const today = getTodayIST();
  const currentYear = Number(today.slice(0, 4));
  const yearOptions = React.useMemo(() => [currentYear - 1, currentYear, currentYear + 1, currentYear + 2], [currentYear]);

  const [year, setYear] = React.useState(String(currentYear));
  const [status, setStatus] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  const [rows, setRows] = React.useState<Holiday[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Holiday | null>(null);
  const [toDelete, setToDelete] = React.useState<Holiday | null>(null);
  const [deleteError, setDeleteError] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const deletingRef = React.useRef(false);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // A custom date range replaces the year filter, as the API does.
  const rangeError =
    fromDate && toDate && toDate < fromDate ? "To date cannot be before the from date." : "";
  const useRange = Boolean(fromDate || toDate);

  React.useEffect(() => {
    if (rangeError) return;
    const controller = new AbortController();
    const params: HolidayParams = {};
    if (useRange) {
      // The API needs both ends to filter by range; an open end falls back to the year window.
      const y = year || String(currentYear);
      params.from_date = fromDate || `${y}-01-01`;
      params.to_date = toDate || `${y}-12-31`;
    } else if (year) {
      params.year = Number(year);
    }
    if (status) params.is_active = status === "active" ? 1 : 0;
    if (search) params.search = search;

    /* eslint-disable react-hooks/set-state-in-effect */
    setIsLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    holidayService
      .list(params, controller.signal)
      .then((r) => {
        setRows(r);
        setIsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(parseApiError(err, "Failed to load holidays.").message);
        setIsLoading(false);
      });
    return () => controller.abort();
  }, [year, status, fromDate, toDate, useRange, search, tick, rangeError, currentYear]);

  const reload = () => setTick((t) => t + 1);

  const toggleActive = async (h: Holiday) => {
    try {
      const res = await holidayService.update(h.id, { is_active: !h.is_active });
      setNotice(res.message ?? "Holiday updated.");
      reload();
    } catch (err) {
      setError(parseApiError(err, "Could not update the holiday.").message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete || deletingRef.current) return;
    deletingRef.current = true;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await holidayService.remove(toDelete.id);
      setToDelete(null);
      setNotice(res.message ?? "Holiday deleted.");
      reload();
    } catch (err) {
      setDeleteError(parseApiError(err, "Could not delete the holiday.").message);
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const columns: Column<Holiday>[] = [
    { key: "date", header: "Date", render: (h) => <span className="tabular-nums">{formatDate(h.holiday_date)}</span> },
    { key: "day", header: "Day", render: (h) => weekdayOf(h.holiday_date) },
    { key: "name", header: "Holiday", render: (h) => <span className="font-medium">{h.name}</span> },
    { key: "description", header: "Description", render: (h) => h.description ?? "—" },
    { key: "status", header: "Status", render: (h) => <StatusPill status={h.is_active ? "Active" : "Inactive"} /> },
  ];

  if (access.edit || access.delete) {
    columns.push({
      key: "actions",
      header: "Actions",
      render: (h) => (
        <span className="flex flex-wrap items-center gap-1">
          {access.edit && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Edit ${h.name} on ${formatDate(h.holiday_date)}`}
                onClick={() => {
                  setEditing(h);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`${h.is_active ? "Deactivate" : "Activate"} ${h.name} on ${formatDate(h.holiday_date)}`}
                onClick={() => toggleActive(h)}
              >
                {h.is_active ? "Deactivate" : "Activate"}
              </Button>
            </>
          )}
          {access.delete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Delete ${h.name} on ${formatDate(h.holiday_date)}`}
              onClick={() => {
                setDeleteError("");
                setToDelete(h);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
            </Button>
          )}
        </span>
      ),
    });
  }

  const filtered = Boolean(status || search || useRange);

  return (
    <MasterPageShell
      title="Holidays"
      note="Company-wide holiday calendar. Active holidays are not counted as leave days and appear as Holiday in attendance and reports."
      successMessage={notice}
      errorMessage={error}
    >
      <section aria-label="Filters" className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-6">
        <Input label="Search" type="search" placeholder="Holiday name" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <Select
          label="Year"
          placeholder="Select year"
          clearable={false}
          options={yearOptions.map((y) => ({ label: String(y), value: String(y) }))}
          value={year}
          onChange={(v) => setYear((v as string) || String(currentYear))}
        />
        <Select
          label="Status"
          placeholder="All statuses"
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          value={status}
          onChange={(v) => setStatus((v as string) || "")}
        />
        <Input label="From date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <Input label="To date" type="date" min={fromDate || undefined} value={toDate} onChange={(e) => setToDate(e.target.value)} error={rangeError} />
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
              Add holiday
            </Button>
          </div>
        )}
      </section>

      <div aria-busy={isLoading} className="grid gap-3">
        {isLoading && !rows ? (
          <Skeleton />
        ) : error && !rows ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface py-10 text-center">
            <p className="text-sm text-ink-soft">Holidays could not be loaded.</p>
            <Button type="button" variant="outline" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        ) : rows && rows.length === 0 && !isLoading ? (
          <Empty message={filtered ? "No holidays match these filters." : `No holidays are defined for ${year}.`} />
        ) : (
          rows && (
            <>
              <DataGrid caption="Holidays" columns={columns} rows={rows} rowKey={(h) => h.id} />
              <p className="text-xs text-muted">{rows.length} holiday{rows.length === 1 ? "" : "s"}</p>
            </>
          )
        )}
      </div>

      <HolidayFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={editing}
        defaultDate={today}
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
        title="Delete holiday"
        description={deleteError || `Delete "${toDelete?.name ?? "this holiday"}" on ${formatDate(toDelete?.holiday_date)}? This cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => !deletingRef.current && setToDelete(null)}
        loading={isDeleting}
      />
    </MasterPageShell>
  );
}
