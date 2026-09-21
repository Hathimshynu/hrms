"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import {
  leavePolicyService,
  type LeavePolicyDto,
  type LeavePolicyPayload,
} from "@/src/lib/masters/leave-policy.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import * as React from "react";
import { MasterFormDialog } from "../components/MasterFormDialog";
import { MasterPageShell } from "../components/MasterPageShell";
import { descriptionColumn, masterExportColumns, nameColumn, statusColumn } from "../components/masterColumns";
import { useMasterCrud } from "../components/useMasterCrud";

const columns: Column<LeavePolicyDto>[] = [
  nameColumn<LeavePolicyDto>(),
  statusColumn<LeavePolicyDto>(),
  descriptionColumn<LeavePolicyDto>(),
];

export default function LeavePoliciesPage() {
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.LEAVE_POLICIES);
  const crud = useMasterCrud<LeavePolicyDto, LeavePolicyPayload>(
    leavePolicyService,
    "Leave Policy",
  );

  return (
    <MasterPageShell
      title="Leave Policies"
      successMessage={crud.successMessage}
      errorMessage={crud.loadError}
    >
      <div className="w-full">
        <DataTable
          data={crud.items}
          columns={columns}
          exportFilename="leave-policies"
          exportColumns={masterExportColumns()}
          keyExtractor={(row) => row.id}
          searchKeys={["name", "code"]}
          pageSize={10}
          isLoading={crud.isLoading}
          emptyMessage="No leave policies found."
          onAdd={crud.openAddDialog}
          addName="Add Leave Policy"
          onEditRow={canEdit ? crud.openEditDialog : undefined}
          onDeleteRow={canDelete ? crud.handleDelete : undefined}
        />
      </div>

      <MasterFormDialog<LeavePolicyDto, LeavePolicyPayload>
        open={crud.isAddDialogOpen || crud.isEditDialogOpen}
        onOpenChange={crud.closeDialogs}
        record={crud.editingItem}
        onSave={crud.handleSave}
        isSaving={crud.isSaving}
        serverErrors={crud.saveFieldErrors}
        formError={crud.saveFormError}
        nounSingular="Leave Policy"
      />

      <DeleteAlert
        open={crud.isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open) crud.handleCancelDelete();
        }}
        title="Delete Leave Policy"
        description={
          crud.deleteError ||
          `Are you sure you want to delete "${crud.itemToDelete?.name || "this leave policy"}"? This action cannot be undone.`
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
