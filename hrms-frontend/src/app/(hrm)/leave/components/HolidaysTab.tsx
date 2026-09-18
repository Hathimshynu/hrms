"use client";

import { format, parseISO } from "date-fns";
import { RefreshCw } from "lucide-react";
import * as React from "react";
import type { Holiday, HolidayType } from "../policy/page";
// Import DataTable components
import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { Column, DataTable } from "@/src/components/ui/Datatable";

const HOLIDAY_TYPE_STYLES: Record<HolidayType, string> = {
  Festival: "bg-purple-50 text-purple-700 border-purple-200",
  National: "bg-blue-50 text-blue-700 border-blue-200",
  Regional: "bg-teal-50 text-teal-700 border-teal-200",
  Optional: "bg-amber-50 text-amber-700 border-amber-200",
};

const HOLIDAY_TYPE_COLORS: Record<HolidayType, string> = {
  Festival: "bg-purple-500",
  National: "bg-blue-500",
  Regional: "bg-teal-500",
  Optional: "bg-amber-500",
};

interface HolidaysTabProps {
  holidays: Holiday[];
  onEdit: (holiday: Holiday) => void;
  onDelete: (id: string) => void;
}

export function HolidaysTab({ holidays, onEdit, onDelete }: HolidaysTabProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [holidayToDelete, setHolidayToDelete] = React.useState<Holiday | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  const sortedHolidays = React.useMemo(
    () =>
      [...holidays].sort(
        (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
      ),
    [holidays],
  );

  const handleDeleteClick = (holiday: Holiday) => {
    setHolidayToDelete(holiday);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!holidayToDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(holidayToDelete.id);
      setIsDeleteAlertOpen(false);
      setHolidayToDelete(null);
    } catch (error) {
      console.error("Error deleting holiday:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteAlertOpen(false);
    setHolidayToDelete(null);
  };

  const columns: Column<Holiday>[] = [
    {
      key: "date",
      header: "Date",
      accessor: (row) => (
        <span className="font-medium text-ink">
          {format(parseISO(row.date), "EEEE, MMMM d, yyyy")}
        </span>
      ),
      sortValue: (row) => row.date,
    },
    {
      key: "name",
      header: "Holiday Name",
      accessor: (row) => (
        <span className="text-sm font-medium text-ink">{row.name}</span>
      ),
      sortValue: (row) => row.name,
    },
    {
      key: "type",
      header: "Type",
      accessor: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${HOLIDAY_TYPE_STYLES[row.type]}`}
        >
          {row.type}
        </span>
      ),
      sortValue: (row) => row.type,
    },
    {
      key: "recurringYearly",
      header: "Recurrence",
      accessor: (row) =>
        row.recurringYearly ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <RefreshCw className="h-3 w-3" /> Repeats Yearly
          </span>
        ) : (
          <span className="text-xs text-muted">-</span>
        ),
      sortValue: (row) => (row.recurringYearly ? "Repeats Yearly" : "One-time"),
    },
  ];

  return (
    <div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {sortedHolidays.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted text-sm">
            No holidays added yet. Click "Add Holiday" to get started.
          </div>
        ) : (
          <DataTable
            data={sortedHolidays}
            columns={columns}
            keyExtractor={(row: Holiday) => row.id}
            searchKeys={["name", "type"]}
            pageSize={8}
            onExport={(rows: Holiday[]) =>
              console.log("Export holidays:", rows)
            }
            onEditRow={(row) => onEdit(row)}
            onDeleteRow={(row) => handleDeleteClick(row)}
            actionColumnHeader="Actions"
          />
        )}
      </div>

      <DeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteAlertOpen(false);
            setHolidayToDelete(null);
          }
        }}
        title="Delete Holiday"
        description={`Are you sure you want to delete "${holidayToDelete?.name || "Holiday"}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
      />
    </div>
  );
}
