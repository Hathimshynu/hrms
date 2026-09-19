"use client";

import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { parseApiError } from "@/src/lib/api/errors";
import { branchService, type BranchDto } from "@/src/lib/masters/branch.service";
import { locationService, type LocationDto } from "@/src/lib/masters/location.service";
import * as React from "react";
import { MasterPageShell } from "../components/MasterPageShell";

// Locations have no create/update/delete API - see EmployeeMasterController
// and routes/api.php ("Employee Masters" group only defines GET
// /employee-masters/locations). This page is intentionally read-only; do
// not fabricate CRUD the backend doesn't support.
interface LocationRow extends LocationDto {
  branchName: string;
}

function buildColumns(): Column<LocationRow>[] {
  return [
    {
      key: "name",
      header: "Location",
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
      key: "branchName",
      header: "Branch",
      accessor: (row) => row.branchName,
      sortValue: (row) => row.branchName,
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
}

const columns = buildColumns();

export default function LocationsPage() {
  const [locations, setLocations] = React.useState<LocationRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadLocations = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Branches are fetched too (same verified read-only endpoint as the
      // Branches page) purely to resolve branch_id -> branch name for
      // display; no data is fabricated.
      const [locationData, branchData] = await Promise.all([
        locationService.list(),
        branchService.list(),
      ]);
      const branchNameById = new Map<number, string>(
        branchData.map((branch: BranchDto) => [branch.id, branch.name]),
      );
      setLocations(
        locationData.map((location) => ({
          ...location,
          branchName: branchNameById.get(location.branch_id) ?? `Branch #${location.branch_id}`,
        })),
      );
    } catch (err) {
      setLoadError(parseApiError(err, "Failed to load locations.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  return (
    <MasterPageShell
      title="Locations"
      note="Locations are read-only in this view - they are managed elsewhere and there is currently no API to create, edit, or delete them here."
      errorMessage={loadError}
    >
      <div className="w-full">
        <DataTable
          data={locations}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchKeys={["name", "code", "city", "state", "country", "branchName"]}
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="No locations found."
          selectable={false}
          enableExport={false}
        />
      </div>
    </MasterPageShell>
  );
}
