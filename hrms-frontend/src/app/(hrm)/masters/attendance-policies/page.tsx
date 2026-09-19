"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import {
  attendancePolicyService,
  type AttendancePolicyDto,
  type AttendancePolicyPayload,
} from "@/src/lib/masters/attendance-policy.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import * as React from "react";
import { MasterFormDialog } from "../components/MasterFormDialog";
import { MasterPageShell } from "../components/MasterPageShell";
import { descriptionColumn, nameColumn, statusColumn } from "../components/masterColumns";
import { useMasterCrud } from "../components/useMasterCrud";

const columns: Column<AttendancePolicyDto>[] = [
  nameColumn<AttendancePolicyDto>(),
  statusColumn<AttendancePolicyDto>(),
  descriptionColumn<AttendancePolicyDto>(),
];

export default function AttendancePoliciesPage() {
  const { edit: canEdit, delete: canDelete } = usePermission(
    MENU_MODULES.ATTENDANCE_POLICIES,
  );
  const crud = useMasterCrud<AttendancePolicyDto, AttendancePolicyPayload>(
    attendancePolicyService,
    "Attendance Policy",
  );

  return (
    <MasterPageShell
      title="Attendance Policies"
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
          emptyMessage="No attendance policies found."
          onAdd={crud.openAddDialog}
          addName="Add Attendance Policy"
          onEditRow={canEdit ? crud.openEditDialog : undefined}
          onDeleteRow={canDelete ? crud.handleDelete : undefined}
        />
      </div>

      <MasterFormDialog<AttendancePolicyDto, AttendancePolicyPayload>
        open={crud.isAddDialogOpen || crud.isEditDialogOpen}
        onOpenChange={crud.closeDialogs}
        record={crud.editingItem}
        onSave={crud.handleSave}
        isSaving={crud.isSaving}
        serverErrors={crud.saveFieldErrors}
        formError={crud.saveFormError}
        nounSingular="Attendance Policy"
      />

      <DeleteAlert
        open={crud.isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open) crud.handleCancelDelete();
        }}
        title="Delete Attendance Policy"
        description={
          crud.deleteError ||
          `Are you sure you want to delete "${crud.itemToDelete?.name || "this attendance policy"}"? This action cannot be undone.`
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
