"use client";

import { formatTime } from "@/src/lib/date/format";
import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import { shiftService, type ShiftDto, type ShiftPayload } from "@/src/lib/masters/shift.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import * as React from "react";
import { MasterFormDialog, type MasterFieldConfig } from "../components/MasterFormDialog";
import { MasterPageShell } from "../components/MasterPageShell";
import { descriptionColumn, nameColumn, statusColumn } from "../components/masterColumns";
import { useMasterCrud } from "../components/useMasterCrud";

const EXTRA_FIELDS: MasterFieldConfig[] = [
  { type: "time", key: "start_time", label: "Start Time" },
  { type: "time", key: "end_time", label: "End Time" },
  { type: "number", key: "working_hours", label: "Working Hours", step: "0.5", min: 0 },
];

const columns: Column<ShiftDto>[] = [
  nameColumn<ShiftDto>(),
  {
    key: "timing",
    header: "Timing",
    accessor: (row) => (
      <span className="text-sm text-gray-700">
        {formatTime(row.start_time)} –{" "}
        {formatTime(row.end_time)}
        {row.working_hours != null && row.working_hours !== "" && (
          <span className="text-gray-400"> ({row.working_hours} hrs)</span>
        )}
      </span>
    ),
  },
  statusColumn<ShiftDto>(),
  descriptionColumn<ShiftDto>(),
];

export default function ShiftsPage() {
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.SHIFTS);
  const crud = useMasterCrud<ShiftDto, ShiftPayload>(shiftService, "Shift");

  return (
    <MasterPageShell
      title="Shifts"
      successMessage={crud.successMessage}
      errorMessage={crud.loadError}
    >
      <div className="w-full">
        <DataTable
          data={crud.items}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchKeys={["name", "code"]}
          pageSize={10}
          isLoading={crud.isLoading}
          emptyMessage="No shifts found."
          onAdd={crud.openAddDialog}
          addName="Add Shift"
          onEditRow={canEdit ? crud.openEditDialog : undefined}
          onDeleteRow={canDelete ? crud.handleDelete : undefined}
        />
      </div>

      <MasterFormDialog<ShiftDto, ShiftPayload>
        open={crud.isAddDialogOpen || crud.isEditDialogOpen}
        onOpenChange={crud.closeDialogs}
        record={crud.editingItem}
        onSave={crud.handleSave}
        isSaving={crud.isSaving}
        serverErrors={crud.saveFieldErrors}
        formError={crud.saveFormError}
        nounSingular="Shift"
        extraFields={EXTRA_FIELDS}
      />

      <DeleteAlert
        open={crud.isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open) crud.handleCancelDelete();
        }}
        title="Delete Shift"
        description={
          crud.deleteError ||
          `Are you sure you want to delete "${crud.itemToDelete?.name || "this shift"}"? This action cannot be undone.`
        }
        confirmText={crud.isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={crud.handleConfirmDelete}
        onCancel={crud.handleCancelDelete}
        loading={crud.isDeleting}
      />
    </MasterPageShell>
  );
}
