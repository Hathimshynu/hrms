// src/app/(hrm)/masters/components/masterColumns.tsx
//
// Small column-builder helpers shared by the 8 CRUD masters pages for
// their common name/status/description columns (identical data shape
// across all 8 - see BaseMasterDto). Each page composes these with its
// own extra column(s) for the fields that genuinely differ (timing,
// off-days, grace window, overtime rule) rather than forcing one layout.
"use client";

import type { Column } from "@/src/components/ui/Datatable";
import { StatusPill } from "@/src/components/ui/Datatable";
import type { BaseMasterDto } from "@/src/lib/masters/master.service";

export function nameColumn<T extends BaseMasterDto>(): Column<T> {
  return {
    key: "name",
    header: "Name",
    accessor: (row) => (
      <div className="min-w-0">
        <span className="font-medium text-stone-800 truncate block">{row.name}</span>
        <span className="text-xs text-gray-500 block">{row.code}</span>
      </div>
    ),
    sortValue: (row) => row.name,
    hideable: false,
  };
}

export function statusColumn<T extends BaseMasterDto>(): Column<T> {
  return {
    key: "status",
    header: "Status",
    accessor: (row) => <StatusPill status={row.is_active ? "Active" : "Inactive"} />,
    sortValue: (row) => (row.is_active ? "Active" : "Inactive"),
  };
}

export function descriptionColumn<T extends BaseMasterDto>(): Column<T> {
  return {
    key: "description",
    header: "Description",
    accessor: (row) => (
      <span className="text-sm text-gray-500 line-clamp-1">{row.description || "—"}</span>
    ),
  };
}
