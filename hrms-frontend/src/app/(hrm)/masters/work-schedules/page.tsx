"use client";

import { formatTime } from "@/src/lib/date/format";
import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import {
  workScheduleService,
  type WorkScheduleDto,
  type WorkSchedulePayload,
} from "@/src/lib/masters/work-schedule.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import * as React from "react";
import { MasterFormDialog, type MasterFieldConfig } from "../components/MasterFormDialog";
import { MasterPageShell } from "../components/MasterPageShell";
import { descriptionColumn, masterExportColumns, nameColumn, statusColumn } from "../components/masterColumns";
import { useMasterCrud } from "../components/useMasterCrud";

const EXTRA_FIELDS: MasterFieldConfig[] = [
  { type: "time", key: "start_time", label: "Start Time" },
  { type: "time", key: "end_time", label: "End Time" },
  { type: "number", key: "working_hours", label: "Working Hours", step: "0.5", min: 0 },
];

const columns: Column<WorkScheduleDto>[] = [
  nameColumn<WorkScheduleDto>(),
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
  statusColumn<WorkScheduleDto>(),
  descriptionColumn<WorkScheduleDto>(),
];

export default function WorkSchedulesPage() {
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.WORK_SCHEDULES);
  const crud = useMasterCrud<WorkScheduleDto, WorkSchedulePayload>(
    workScheduleService,
    "Work Schedule",
  );

  return (
    <MasterPageShell
      title="Work Schedules"
      successMessage={crud.successMessage}
      errorMessage={crud.loadError}
    >
      <div className="w-full">
        <DataTable
          data={crud.items}
          columns={columns}
          exportFilename="work-schedules"
          exportColumns={masterExportColumns<WorkScheduleDto>([
            { header: "Start Time", value: (r) => formatTime(r.start_time) },
            { header: "End Time", value: (r) => formatTime(r.end_time) },
            { header: "Working Hours", value: (r) => (r.working_hours == null || r.working_hours === "" ? null : Number(r.working_hours)) },
          ])}
          keyExtractor={(row) => row.id}
          searchKeys={["name", "code"]}
          pageSize={10}
          isLoading={crud.isLoading}
          emptyMessage="No work schedules found."
          onAdd={crud.openAddDialog}
          addName="Add Work Schedule"
          onEditRow={canEdit ? crud.openEditDialog : undefined}
          onDeleteRow={canDelete ? crud.handleDelete : undefined}
        />
      </div>

      <MasterFormDialog<WorkScheduleDto, WorkSchedulePayload>
        open={crud.isAddDialogOpen || crud.isEditDialogOpen}
        onOpenChange={crud.closeDialogs}
        record={crud.editingItem}
        onSave={crud.handleSave}
        isSaving={crud.isSaving}
        serverErrors={crud.saveFieldErrors}
        formError={crud.saveFormError}
        nounSingular="Work Schedule"
        extraFields={EXTRA_FIELDS}
      />

      <DeleteAlert
        open={crud.isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open) crud.handleCancelDelete();
        }}
        title="Delete Work Schedule"
        description={
          crud.deleteError ||
          `Are you sure you want to delete "${crud.itemToDelete?.name || "this work schedule"}"? This action cannot be undone.`
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
