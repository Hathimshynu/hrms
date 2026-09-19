"use client";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";
import { Input } from "./Input";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  hideable?: boolean;
  className?: string;
  cellClassName?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  searchKeys?: (keyof T | string)[];
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filtersSlot?: React.ReactNode;
  selectable?: boolean;
  selected?: Set<string | number>;
  onSelectedChange?: (next: Set<string | number>) => void;
  pageSize?: number;
  onAdd?: () => void;
  onExport?: (rows: T[]) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  addName?: string;
  onViewRow?: (row: T) => void;
  onEditRow?: (row: T) => void;
  onDeleteRow?: (row: T) => void;
  actionColumnHeader?: string;
  showActions?: boolean;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  enableFilter?: boolean;
  enableSearch?: boolean;
}

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`flex h-4.5 w-4.5 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
        ${checked || indeterminate ? "border-primary bg-primary" : "border-border bg-surface hover:border-primary/50"}`}
    >
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      {indeterminate && !checked && (
        <span className="h-0.5 w-2 rounded-full bg-white" />
      )}
    </button>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-yellow-100 text-yellow-700",
  inactive: "bg-red-100 text-red-700",
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
  "half day": "bg-orange-100 text-orange-700",
  "on leave": "bg-purple-100 text-purple-700",
  "work from home": "bg-blue-100 text-blue-700",
  holiday: "bg-pink-100 text-pink-700",
  "week off": "bg-slate-100 text-slate-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export function StatusPill({ status }: { status: string }) {
  const style =
    STATUS_STYLES[status.toLowerCase()] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md p-2 text-[13px] font-medium ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function Avatar({ src, name }: { src?: string; name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    return (
      // Employee photo URLs come from the backend at runtime (arbitrary
      // origin), so next/image's remotePatterns can't be configured for them.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-muted ring-1 ring-border">
      {initials}
    </span>
  );
}

export function FilterPill({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const active = selected.size > 0;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border px-4 text-sm font-semibold transition-all duration-200 ${
          active
            ? "border-primary bg-primary text-white hover:bg-primary-dark"
            : "border-border bg-surface text-ink hover:border-primary/30 hover:bg-surface-muted"
        }`}
      >
        {label}
        {active && (
          <span className="rounded-full bg-white/20 px-1.5 text-xs">
            {selected.size}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""} ${active ? "text-white" : "text-muted"}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-2 w-52 max-w-[80vw] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          {options.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-muted">No options</p>
          ) : (
            options.map((opt) => {
              const isChecked = selected.has(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-soft transition-all duration-200 hover:bg-surface-muted"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-xs border transition-all duration-200 ${
                      isChecked ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {isChecked && (
                      <Check
                        className="h-2.5 w-2.5 text-white"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  {opt}
                </button>
              );
            })
          )}
          {active && (
            <>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={onClear}
                className="w-full cursor-pointer rounded-lg px-2.5 py-2 text-left text-sm text-muted transition-all duration-200 hover:bg-red-100 hover:text-red-700"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  const totalPages = total;
  const cur = current;
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const pages = new Set<number>([0, totalPages - 1, cur, cur - 1, cur + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 0 && p < totalPages)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(sorted[i]);
  }
  return result;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchKeys = [],
  searchPlaceholder = "Search...",
  filters = [],
  filtersSlot,
  selectable = true,
  selected: selectedProp,
  onSelectedChange,
  pageSize = 10,
  onAdd,
  addName = "Add New",
  isLoading = false,
  emptyMessage = "No results found.",
  onViewRow,
  onEditRow,
  onDeleteRow,
  actionColumnHeader = "Actions",
  enableColumnVisibility = true,
  enableFilter = true,
  enableSearch = true,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDirection>(null);
  const [internalSelected, setInternalSelected] = React.useState<
    Set<string | number>
  >(new Set());
  const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(new Set());
  const [colMenuOpen, setColMenuOpen] = React.useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [activeFilters, setActiveFilters] = React.useState<
    Map<string, Set<string>>
  >(new Map(filters.map((f) => [f.key, new Set(f.defaultValue || [])])));

  const selected = selectedProp ?? internalSelected;
  const setSelected = onSelectedChange ?? setInternalSelected;

  const hasRowActions = !!(onViewRow || onEditRow || onDeleteRow);

  const colMenuRef = React.useRef<HTMLDivElement>(null);
  const filterMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node))
        setColMenuOpen(false);
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target as Node)
      )
        setFilterMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key));

  const filtered = React.useMemo(() => {
    let result = data;

    if (search.trim() && searchKeys.length > 0) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((k) =>
          String((row as unknown as Record<string, unknown>)[k as string] ?? "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    for (const [key, selectedValues] of activeFilters) {
      if (selectedValues.size > 0) {
        result = result.filter((row) => {
          const value = String((row as unknown as Record<string, unknown>)[key] ?? "");
          return selectedValues.has(value);
        });
      }
    }

    return result;
  }, [data, search, searchKeys, activeFilters]);

  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const getVal = col.sortValue ?? ((r: T) => (r as unknown as Record<string, string | number>)[sortKey]);
    return [...filtered].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  React.useEffect(
    () => setPage(0),
    [data, search, sortKey, sortDir, activeFilters],
  );

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  function toggleRow(id: string | number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAllOnPage() {
    const ids = pageRows.map(keyExtractor);
    const all = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
    setSelected(next);
  }

  function toggleFilter(key: string, value: string) {
    setActiveFilters((prev) => {
      const next = new Map(prev);
      const current = next.get(key) || new Set();
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      next.set(key, current);
      return next;
    });
  }

  function clearAllFilters() {
    setActiveFilters(new Map(filters.map((f) => [f.key, new Set()])));
  }

  const ids = pageRows.map(keyExtractor);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = ids.some((id) => selected.has(id)) && !allSelected;

  const totalActiveFilters = Array.from(activeFilters.values()).reduce(
    (sum, set) => sum + set.size,
    0,
  );

  return (
    <div className="w-full rounded-xl bg-surface p-3 sm:p-6 shadow-sm border">
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {enableSearch && searchKeys.length > 0 && (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-200 group-focus-within:text-primary" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder ?? "Search"}
                // className="w-full h-12 cursor-text rounded-full border border-border bg-[#F2F2F2] py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted outline-none transition-all duration-200 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {filtersSlot && (
              <div className="flex flex-wrap items-center gap-2">
                {filtersSlot}
              </div>
            )}

            {enableFilter && filters.length > 0 && (
              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => setFilterMenuOpen((o) => !o)}
                  className={`flex h-12 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-all duration-200 ${
                    totalActiveFilters > 0
                      ? "border-primary bg-primary text-white hover:bg-primary-dark"
                      : "border-border bg-surface text-ink hover:border-primary/30 hover:bg-surface-muted"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {totalActiveFilters > 0 && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      {totalActiveFilters}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${filterMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {filterMenuOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-72 max-w-[90vw] rounded-lg border border-border bg-surface p-3 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">Filters</h4>
                      {totalActiveFilters > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="text-xs text-muted hover:text-primary transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-3">
                      {filters.map((filter) => {
                        const selectedValues =
                          activeFilters.get(filter.key) || new Set();
                        return (
                          <div key={filter.key}>
                            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                              {filter.label}
                            </div>
                            <div className="space-y-1">
                              {filter.options.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() =>
                                    toggleFilter(filter.key, option.value)
                                  }
                                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-all duration-200 hover:bg-surface-muted"
                                >
                                  <span
                                    className={`flex h-4 w-4 items-center justify-center rounded-xs border transition-all duration-200 ${
                                      selectedValues.has(option.value)
                                        ? "border-primary bg-primary"
                                        : "border-border"
                                    }`}
                                  >
                                    {selectedValues.has(option.value) && (
                                      <Check
                                        className="h-2.5 w-2.5 text-white"
                                        strokeWidth={3}
                                      />
                                    )}
                                  </span>
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {enableColumnVisibility && (
              <div className="relative" ref={colMenuRef}>
                <button
                  onClick={() => setColMenuOpen((o) => !o)}
                  className="flex h-12 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-ink transition-all duration-200 hover:border-primary/30 hover:bg-surface-muted"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Columns</span>
                </button>
                {colMenuOpen && (
                  <div className="absolute right-0 z-30 mt-2 min-w-45 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-lg">
                    {columns.map((col) => (
                      <button
                        key={col.key}
                        onClick={() => {
                          setHiddenCols((prev) => {
                            const next = new Set(prev);
                            if (next.has(col.key)) next.delete(col.key);
                            else next.add(col.key);
                            return next;
                          });
                        }}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-soft transition-all duration-200 hover:bg-surface-muted"
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-xs border transition-all duration-200 ${
                            !hiddenCols.has(col.key)
                              ? "border-primary bg-primary"
                              : "border-border"
                          }`}
                        >
                          {!hiddenCols.has(col.key) && (
                            <Check
                              className="h-2.5 w-2.5 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </span>
                        {col.header}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {onAdd && (
              <button
                onClick={onAdd}
                aria-label="Add"
                className="flex h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{addName}</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Pills */}
        {totalActiveFilters > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {Array.from(activeFilters.entries()).map(([key, values]) => {
              if (values.size === 0) return null;
              const filter = filters.find((f) => f.key === key);
              if (!filter) return null;
              return Array.from(values).map((value) => {
                const option = filter.options.find((o) => o.value === value);
                return (
                  <span
                    key={`${key}-${value}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {filter.label}: {option?.label || value}
                    <button
                      onClick={() => toggleFilter(key, value)}
                      className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              });
            })}
            <button
              onClick={clearAllFilters}
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="min-h-100 rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-[15px]">
            <thead>
              <tr className="bg-primary border-b border-border">
                {selectable && (
                  <th className="w-12 px-4 py-4 text-left align-middle">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAllOnPage}
                      ariaLabel="Select all rows on this page"
                    />
                  </th>
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-4 text-left align-middle text-white font-bold text-base ${col.className ?? ""}`}
                  >
                    {col.sortable === false ? (
                      col.header
                    ) : (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="flex cursor-pointer items-center gap-1.5 text-white hover:text-white/80 transition-colors duration-200"
                      >
                        {col.header}
                        <ChevronsUpDown
                          className={`h-4 w-4 transition-all duration-200 ${
                            sortKey === col.key ? "text-white" : "text-white/70"
                          }`}
                        />
                      </button>
                    )}
                  </th>
                ))}
                {hasRowActions && (
                  <th className="px-4 py-4 text-center align-middle text-white font-bold text-base">
                    {actionColumnHeader}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-border" aria-hidden="true">
                    <td
                      colSpan={
                        visibleColumns.length +
                      (selectable ? 1 : 0) +
                      (hasRowActions ? 1 : 0)
                      }
                      className="px-4 py-4"
                    >
                      <div className="h-5 w-full animate-pulse rounded-md bg-black/5" />
                    </td>
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      visibleColumns.length +
                      (selectable ? 1 : 0) +
                      (hasRowActions ? 1 : 0)
                    }
                    className="px-3 py-16 text-center"
                  >
                    <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                      <Search className="size-5" />
                    </span>
                    <span className="block text-sm font-semibold text-ink">{emptyMessage}</span>
                    <span className="mt-1 block text-xs text-muted">Try adjusting your search or filters.</span>
                  </td>
                </tr>
              ) : (
                pageRows.map((row, rowIndex) => {
                  const id = keyExtractor(row);
                  const isSelected = selected.has(id);
                  return (
                    <tr
                      key={`${String(id)}-${rowIndex}`}
                      className={`border-b border-border transition-all duration-200 ${
                        isSelected ? "bg-primary/5" : "hover:bg-surface-muted"
                      } ${rowIndex % 2 === 0 ? "bg-white" : "bg-surface"}`}
                    >
                      {selectable && (
                        <td className="px-4 py-3.5 align-middle">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                            ariaLabel={`Select row ${id}`}
                          />
                        </td>
                      )}
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3.5 align-middle text-sm leading-snug text-ink ${
                            col.cellClassName ?? ""
                          }`}
                        >
                          {col.accessor
                            ? col.accessor(row)
                            : (row as unknown as Record<string, React.ReactNode>)[col.key]}
                        </td>
                      ))}
                      {hasRowActions && (
                        <td className="px-4 py-3.5 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                            {onViewRow && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewRow(row);
                                }}
                                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-all duration-200 cursor-pointer group"
                                aria-label="View"
                                title="View details"
                              >
                                <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                              </button>
                            )}
                            {onEditRow && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditRow(row);
                                }}
                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 cursor-pointer group"
                                aria-label="Edit"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4 group-hover:scale-110 transition-transform" />
                              </button>
                            )}
                            {onDeleteRow && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteRow(row);
                                }}
                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer group"
                                aria-label="Delete"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-3 px-1 sm:px-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          {selectable
            ? `${selected.size} of ${sorted.length} row(s) selected.`
            : `${sorted.length} row(s).`}
        </span>
        <div className="flex items-center justify-center gap-2 overflow-x-auto sm:justify-end">
          <button
            onClick={() => setPage(0)}
            disabled={currentPage === 0}
            aria-label="First page"
            className="hidden sm:flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-ink transition-all duration-200 hover:border-primary/30 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex h-12 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full border border-border bg-surface px-3 sm:px-4 font-semibold text-ink transition-all duration-200 hover:border-primary/30 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="hidden items-center gap-1.5 sm:flex">
            {getPageNumbers(currentPage, pageCount).map((p, idx) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-12 w-10 items-center justify-center text-muted"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p + 1}`}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border font-semibold transition-all duration-200 ${
                    p === currentPage
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-ink hover:border-primary/30 hover:bg-surface-muted"
                  }`}
                >
                  {p + 1}
                </button>
              ),
            )}
          </div>

          <span className="flex h-12 shrink-0 items-center justify-center px-2 text-sm font-semibold text-ink sm:hidden">
            {currentPage + 1} / {pageCount}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            className="flex h-12 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full border border-border bg-surface px-3 sm:px-4 font-semibold text-ink transition-all duration-200 hover:border-primary/30 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(pageCount - 1)}
            disabled={currentPage >= pageCount - 1}
            aria-label="Last page"
            className="hidden sm:flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-ink transition-all duration-200 hover:border-primary/30 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
