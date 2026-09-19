"use client";

import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { parseApiError } from "@/src/lib/api/errors";
import { branchService, type BranchDto } from "@/src/lib/masters/branch.service";
import * as React from "react";
import { MasterPageShell } from "../components/MasterPageShell";

// Branches have no create/update/delete API - see EmployeeMasterController
// and routes/api.php ("Employee Masters" group only defines GET
// /employee-masters/branches). This page is intentionally read-only; do
// not fabricate CRUD the backend doesn't support.
const columns: Column<BranchDto>[] = [
  {
    key: "name",
    header: "Branch",
    accessor: (row) => (
      <div className="min-w-0">
        <span className="font-medium text-stone-800 truncate block">{row.name}</span>
        <span className="text-xs text-gray-500 block">{row.code}</span>
      </div>
    ),
    sortValue: (row) => row.name,
    hideable: false,
  },
  {
    key: "city",
    header: "City",
    accessor: (row) => row.city || "—",
  },
  {
    key: "state",
    header: "State",
    accessor: (row) => row.state || "—",
  },
  {
    key: "country",
    header: "Country",
    accessor: (row) => row.country || "—",
  },
];

export default function BranchesPage() {
  const [branches, setBranches] = React.useState<BranchDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadBranches = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await branchService.list();
      setBranches(data);
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load branches.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  return (
    <MasterPageShell
      title="Branches"
      note="Branches are read-only in this view - they are managed elsewhere and there is currently no API to create, edit, or delete them here."
      errorMessage={loadError}
    >
      <div className="w-full">
        <DataTable
          data={branches}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchKeys={["name", "code", "city", "state", "country"]}
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="No branches found."
          selectable={false}
          enableExport={false}
        />
      </div>
    </MasterPageShell>
  );
}
