"use client";

import { ArrowLeft, Check, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { ExportMenu } from "@/src/components/common/ExportMenu";
import { InlineBanner } from "@/src/components/common/InlineBanner";
import { Button } from "@/src/components/ui/Button";
import { StatusPill } from "@/src/components/ui/Datatable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { usePermission } from "@/src/hooks/usePermission";
import { parseApiError } from "@/src/lib/api/errors";
import { formatDateTime } from "@/src/lib/date/format";
import { downloadServerExport } from "@/src/lib/export/download";
import {
  MONTH_OPTIONS,
  formatAmount,
  monthLabel,
  payrollService,
  type PayrollRecord,
  type PayrollStatus,
  type PayrollSummary,
} from "@/src/lib/payroll/payroll.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import { PayrollCreateDialog } from "./components/PayrollCreateDialog";
import { PayrollEditDialog } from "./components/PayrollEditDialog";

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Processed", value: "processed" },
];

const statusLabel = (s: PayrollStatus) => (s === "draft" ? "Draft" : "Processed");

type Confirm = { kind: "process" | "delete"; payroll: PayrollRecord };

export default function SalaryPage() {
  const { view: canView, edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.PAYROLL);
  const { view: canCreate } = usePermission(MENU_MODULES.PAYROLL_CREATE);
  const { view: canProcess } = usePermission(MENU_MODULES.PAYROLL_PROCESS);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const [month, setMonth] = React.useState("");
  const [year, setYear] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [rows, setRows] = React.useState<PayrollRecord[]>([]);
  const [summary, setSummary] = React.useState<PayrollSummary | null>(null);
  const [lastPage, setLastPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PayrollRecord | null>(null);
  const [viewing, setViewing] = React.useState<PayrollRecord | null>(null);
  const [confirm, setConfirm] = React.useState<Confirm | null>(null);
  const [confirmError, setConfirmError] = React.useState("");
  const [isConfirming, setIsConfirming] = React.useState(false);

  const yearValid = year === "" || (/^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 2100);

  const filterParams = React.useMemo(
    () => ({
      search: search || undefined,
      month: month ? Number(month) : undefined,
      year: year && yearValid ? Number(year) : undefined,
      status: (status as PayrollStatus) || undefined,
    }),
    [search, month, year, yearValid, status],
  );

  const load = React.useCallback(async () => {
    if (!canView) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await payrollService.list({ ...filterParams, page, per_page: 15 });
      setRows(result.payrolls.data);
      setLastPage(result.payrolls.last_page);
      setSummary(result.summary);
    } catch (err) {
      setError(parseApiError(err, "Failed to load payroll.").message);
    } finally {
      setIsLoading(false);
    }
  }, [canView, filterParams, page]);

  React.useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const resetPage = () => setPage(1);

  const runConfirm = async () => {
    if (!confirm || isConfirming) return;
    setIsConfirming(true);
    setConfirmError("");
    try {
      if (confirm.kind === "process") await payrollService.process(confirm.payroll.id);
      else await payrollService.remove(confirm.payroll.id);
      setNotice(confirm.kind === "process" ? "Payroll processed." : "Payroll draft deleted.");
      setConfirm(null);
      await load();
    } catch (err) {
      setConfirmError(parseApiError(err, "The action could not be completed.").message);
    } finally {
      setIsConfirming(false);
    }
  };

  const name = (p: PayrollRecord) =>
    p.employee ? `${p.employee.first_name} ${p.employee.last_name}`.trim() : `Employee #${p.employee_id}`;

  if (!canView) {
    return (
      <div className="min-h-screen w-full bg-[#F2F2F2] px-3 py-6 sm:px-6 lg:px-8">
        <p role="status" className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-ink-soft">
          You don&apos;t have permission to view payroll.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2]">
      <div className="sticky top-0 z-40 bg-[#F2F2F2] px-3 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
            </button>
            <h1 className="truncate text-lg font-light sm:text-2xl">Payroll</h1>
          </div>
          <div className="flex items-center gap-2">
            <ExportMenu
              label="payroll"
              onExport={(format) => downloadServerExport("/payrolls/export", filterParams, format, "payroll")}
            />
            {canCreate && (
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> New payroll
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-4 px-3 py-4 sm:px-6 lg:px-8">
        {notice && <InlineBanner type="success" message={notice} />}
        {error && <InlineBanner type="error" message={error} />}

        <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-6" aria-label="Payroll filters">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              type="search"
              aria-label="Search employee"
              placeholder="Search name or code…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                resetPage();
              }}
            />
            <Select
              aria-label="Filter by month"
              placeholder="All months"
              options={MONTH_OPTIONS}
              value={month}
              clearable
              onChange={(v) => {
                setMonth((v as string) || "");
                resetPage();
              }}
            />
            <Input
              type="number"
              inputMode="numeric"
              aria-label="Filter by year"
              placeholder="Year"
              min={2000}
              max={2100}
              value={year}
              error={yearValid ? undefined : "Enter a 4-digit year."}
              onChange={(e) => {
                setYear(e.target.value);
                resetPage();
              }}
            />
            <Select
              aria-label="Filter by status"
              placeholder="All statuses"
              options={STATUS_OPTIONS}
              value={status}
              clearable
              onChange={(v) => {
                setStatus((v as string) || "");
                resetPage();
              }}
            />
          </div>
        </section>

        {summary && (
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Payroll totals for the current filters">
            {[
              ["Records", String(summary.records)],
              ["Basic", formatAmount(summary.basic_salary)],
              ["Gross", formatAmount(summary.gross_salary)],
              ["Deductions", formatAmount(summary.total_deductions)],
              ["Net", formatAmount(summary.net_salary)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-surface p-4">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="text-xl font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6" aria-label="Payroll records">
          {isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-black/5" aria-hidden="true" />
          ) : rows.length === 0 && !error ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
              No payroll records match these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="sr-only">Payroll records</caption>
                <thead className="text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Employee</th>
                    <th scope="col" className="px-3 py-2 font-medium">Period</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Gross</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Deductions</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Net</th>
                    <th scope="col" className="px-3 py-2 font-medium">Status</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="px-3 py-2 text-ink">
                        {name(p)}
                        {p.employee?.employee_code && <span className="ml-2 text-xs text-muted">{p.employee.employee_code}</span>}
                      </td>
                      <td className="px-3 py-2 text-ink-soft">{monthLabel(p.payroll_month, p.payroll_year)}</td>
                      <td className="px-3 py-2 text-right text-ink">{formatAmount(p.gross_salary)}</td>
                      <td className="px-3 py-2 text-right text-ink">{formatAmount(p.total_deductions)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-ink">{formatAmount(p.net_salary)}</td>
                      <td className="px-3 py-2">
                        <StatusPill status={statusLabel(p.status)} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setViewing(p)} aria-label={`View payroll for ${name(p)}, ${monthLabel(p.payroll_month, p.payroll_year)}`} className="flex size-9 items-center justify-center rounded-lg hover:bg-surface-muted">
                            <Eye className="size-4" />
                          </button>
                          {p.status === "draft" && canEdit && (
                            <button type="button" onClick={() => setEditing(p)} aria-label={`Edit payroll draft for ${name(p)}`} className="flex size-9 items-center justify-center rounded-lg hover:bg-surface-muted">
                              <Pencil className="size-4" />
                            </button>
                          )}
                          {p.status === "draft" && canProcess && (
                            <button type="button" onClick={() => { setConfirm({ kind: "process", payroll: p }); setConfirmError(""); }} aria-label={`Process payroll for ${name(p)}`} className="flex size-9 items-center justify-center rounded-lg text-green-700 hover:bg-green-50">
                              <Check className="size-4" />
                            </button>
                          )}
                          {p.status === "draft" && canDelete && (
                            <button type="button" onClick={() => { setConfirm({ kind: "delete", payroll: p }); setConfirmError(""); }} aria-label={`Delete payroll draft for ${name(p)}`} className="flex size-9 items-center justify-center rounded-lg text-red-700 hover:bg-red-50">
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lastPage > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button type="button" size="sm" variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-muted">
                Page {page} of {lastPage}
              </span>
              <Button type="button" size="sm" variant="outline" disabled={page >= lastPage || isLoading} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </section>
      </div>

      <PayrollCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setNotice("Payroll draft created.");
          load();
        }}
      />

      <PayrollEditDialog
        payroll={editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={() => {
          setNotice("Payroll draft updated.");
          load();
        }}
      />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          <DialogHeader className="bg-primary px-6 py-4 text-primary-foreground">
            <DialogTitle className="text-xl">Payroll details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <dl className="grid gap-2 px-6 py-6 text-sm">
              {[
                ["Employee", `${name(viewing)}${viewing.employee?.employee_code ? ` (${viewing.employee.employee_code})` : ""}`],
                ["Department", viewing.employee?.department?.name ?? "—"],
                ["Period", monthLabel(viewing.payroll_month, viewing.payroll_year)],
                ["Basic salary", formatAmount(viewing.basic_salary)],
                ["Gross salary", formatAmount(viewing.gross_salary)],
                ["Total deductions", formatAmount(viewing.total_deductions)],
                ["Net salary", formatAmount(viewing.net_salary)],
                ["Status", statusLabel(viewing.status)],
                ["Processed at", viewing.processed_at ? formatDateTime(viewing.processed_at) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && !isConfirming && setConfirm(null)}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          <DialogHeader className="bg-primary px-6 py-4 text-primary-foreground">
            <DialogTitle className="text-xl">{confirm?.kind === "process" ? "Process payroll" : "Delete payroll draft"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 px-6 py-6 text-sm">
            {confirmError && <InlineBanner type="error" message={confirmError} />}
            {confirm && (
              <p className="text-ink-soft">
                {confirm.kind === "process"
                  ? `Process ${name(confirm.payroll)}'s payroll for ${monthLabel(confirm.payroll.payroll_month, confirm.payroll.payroll_year)}? Processed payroll can no longer be edited or deleted.`
                  : `Delete the draft for ${name(confirm.payroll)} (${monthLabel(confirm.payroll.payroll_month, confirm.payroll.payroll_year)})? This cannot be undone.`}
              </p>
            )}
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setConfirm(null)} disabled={isConfirming}>
              Cancel
            </Button>
            <Button type="button" isLoading={isConfirming} onClick={runConfirm}>
              {confirm?.kind === "process" ? "Process" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
