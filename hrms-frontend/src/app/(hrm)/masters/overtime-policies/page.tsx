"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import {
  overtimePolicyService,
  type OvertimePolicyDto,
  type OvertimePolicyPayload,
} from "@/src/lib/masters/overtime-policy.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import * as React from "react";
import { MasterFormDialog, type MasterFieldConfig } from "../components/MasterFormDialog";
import { MasterPageShell } from "../components/MasterPageShell";
import { descriptionColumn, nameColumn, statusColumn } from "../components/masterColumns";
import { useMasterCrud } from "../components/useMasterCrud";

const EXTRA_FIELDS: MasterFieldConfig[] = [
  { type: "number", key: "minimum_hours", label: "Minimum Hours", step: "0.5", min: 0 },
  { type: "number", key: "multiplier", label: "Multiplier", step: "0.1", min: 0 },
];

const columns: Column<OvertimePolicyDto>[] = [
  nameColumn<OvertimePolicyDto>(),
  {
    key: "overtimeRule",
    header: "Min Hours / Multiplier",
    accessor: (row) => (
      <span className="text-sm text-gray-700">
        {row.minimum_hours ?? "—"} hrs × {row.multiplier ?? "—"}
      </span>
    ),
  },
  statusColumn<OvertimePolicyDto>(),
  descriptionColumn<OvertimePolicyDto>(),
];

export default function OvertimePoliciesPage() {
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.OVERTIME_POLICIES);
  const crud = useMasterCrud<OvertimePolicyDto, OvertimePolicyPayload>(
    overtimePolicyService,
    "Overtime Policy",
  );

  return (
    <MasterPageShell
      title="Overtime Policies"
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
          emptyMessage="No overtime policies found."
          onAdd={crud.openAddDialog}
          addName="Add Overtime Policy"
          onEditRow={canEdit ? crud.openEditDialog : undefined}
          onDeleteRow={canDelete ? crud.handleDelete : undefined}
        />
      </div>

      <MasterFormDialog<OvertimePolicyDto, OvertimePolicyPayload>
        open={crud.isAddDialogOpen || crud.isEditDialogOpen}
        onOpenChange={crud.closeDialogs}
        record={crud.editingItem}
        onSave={crud.handleSave}
        isSaving={crud.isSaving}
        serverErrors={crud.saveFieldErrors}
        formError={crud.saveFormError}
        nounSingular="Overtime Policy"
        extraFields={EXTRA_FIELDS}
      />

      <DeleteAlert
        open={crud.isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open) crud.handleCancelDelete();
        }}
        title="Delete Overtime Policy"
        description={
          crud.deleteError ||
          `Are you sure you want to delete "${crud.itemToDelete?.name || "this overtime policy"}"? This action cannot be undone.`
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
