"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import {
  latePolicyService,
  type LatePolicyDto,
  type LatePolicyPayload,
} from "@/src/lib/masters/late-policy.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import * as React from "react";
import { MasterFormDialog, type MasterFieldConfig } from "../components/MasterFormDialog";
import { MasterPageShell } from "../components/MasterPageShell";
import { descriptionColumn, nameColumn, statusColumn } from "../components/masterColumns";
import { useMasterCrud } from "../components/useMasterCrud";

const EXTRA_FIELDS: MasterFieldConfig[] = [
  { type: "integer", key: "grace_minutes", label: "Grace Minutes", min: 0 },
  { type: "integer", key: "max_late_minutes", label: "Max Late Minutes", min: 0 },
];

const columns: Column<LatePolicyDto>[] = [
  nameColumn<LatePolicyDto>(),
  {
    key: "lateWindow",
    header: "Grace / Max Late",
    accessor: (row) => (
      <span className="text-sm text-gray-700">
        {row.grace_minutes ?? "—"} min / {row.max_late_minutes ?? "—"} min
      </span>
    ),
  },
  statusColumn<LatePolicyDto>(),
  descriptionColumn<LatePolicyDto>(),
];

export default function LatePoliciesPage() {
  const { edit: canEdit, delete: canDelete } = usePermission(MENU_MODULES.LATE_POLICIES);
  const crud = useMasterCrud<LatePolicyDto, LatePolicyPayload>(
    latePolicyService,
    "Late Policy",
  );

  return (
    <MasterPageShell
      title="Late Policies"
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
          emptyMessage="No late policies found."
          onAdd={crud.openAddDialog}
          addName="Add Late Policy"
          onEditRow={canEdit ? crud.openEditDialog : undefined}
          onDeleteRow={canDelete ? crud.handleDelete : undefined}
        />
      </div>

      <MasterFormDialog<LatePolicyDto, LatePolicyPayload>
        open={crud.isAddDialogOpen || crud.isEditDialogOpen}
        onOpenChange={crud.closeDialogs}
        record={crud.editingItem}
        onSave={crud.handleSave}
        isSaving={crud.isSaving}
        serverErrors={crud.saveFieldErrors}
        formError={crud.saveFormError}
        nounSingular="Late Policy"
        extraFields={EXTRA_FIELDS}
      />

      <DeleteAlert
        open={crud.isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open) crud.handleCancelDelete();
        }}
        title="Delete Late Policy"
        description={
          crud.deleteError ||
          `Are you sure you want to delete "${crud.itemToDelete?.name || "this late policy"}"? This action cannot be undone.`
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
