"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import {
  weeklyOffService,
  type WeeklyOffDto,
  type WeeklyOffPayload,
} from "@/src/lib/masters/weekly-off.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import * as React from "react";
import { MasterFormDialog, type MasterFieldConfig } from "../components/MasterFormDialog";
import { MasterPageShell } from "../components/MasterPageShell";
import { descriptionColumn, nameColumn, statusColumn } from "../components/masterColumns";
import { useMasterCrud } from "../components/useMasterCrud";

const EXTRA_FIELDS: MasterFieldConfig[] = [{ type: "days", key: "days", label: "Off Days" }];

const columns: Column<WeeklyOffDto>[] = [
  nameColumn<WeeklyOffDto>(),
  {
    key: "days",
    header: "Off Days",
    accessor: (row) => (
      <span className="text-sm text-gray-700">
        {row.days && row.days.length > 0 ? row.days.join(", ") : "—"}
      </span>
    ),
  },
  statusColumn<WeeklyOffDto>(),
  descriptionColumn<WeeklyOffDto>(),
];

export default function WeeklyOffsPage() {
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.WEEKLY_OFFS);
  const crud = useMasterCrud<WeeklyOffDto, WeeklyOffPayload>(weeklyOffService, "Weekly Off");

  return (
    <MasterPageShell
      title="Weekly Offs"
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
          emptyMessage="No weekly offs found."
          onAdd={crud.openAddDialog}
          addName="Add Weekly Off"
          onEditRow={canEdit ? crud.openEditDialog : undefined}
          onDeleteRow={canDelete ? crud.handleDelete : undefined}
        />
      </div>

      <MasterFormDialog<WeeklyOffDto, WeeklyOffPayload>
        open={crud.isAddDialogOpen || crud.isEditDialogOpen}
        onOpenChange={crud.closeDialogs}
        record={crud.editingItem}
        onSave={crud.handleSave}
        isSaving={crud.isSaving}
        serverErrors={crud.saveFieldErrors}
        formError={crud.saveFormError}
        nounSingular="Weekly Off"
        extraFields={EXTRA_FIELDS}
      />

      <DeleteAlert
        open={crud.isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open) crud.handleCancelDelete();
        }}
        title="Delete Weekly Off"
        description={
          crud.deleteError ||
          `Are you sure you want to delete "${crud.itemToDelete?.name || "this weekly off"}"? This action cannot be undone.`
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
