"use client";

import { DeleteAlert } from "@/src/components/common/ReusableAlert";
import { DataTable, type Column } from "@/src/components/ui/Datatable";
import { usePermission } from "@/src/hooks/usePermission";
import {
  onboardingChecklistService,
  type OnboardingChecklistDto,
  type OnboardingChecklistPayload,
} from "@/src/lib/masters/onboarding-checklist.service";
import { MENU_MODULES } from "@/src/permissions/permissions";
import * as React from "react";
import { MasterFormDialog } from "../components/MasterFormDialog";
import { MasterPageShell } from "../components/MasterPageShell";
import { descriptionColumn, nameColumn, statusColumn } from "../components/masterColumns";
import { useMasterCrud } from "../components/useMasterCrud";

const columns: Column<OnboardingChecklistDto>[] = [
  nameColumn<OnboardingChecklistDto>(),
  statusColumn<OnboardingChecklistDto>(),
  descriptionColumn<OnboardingChecklistDto>(),
];

export default function OnboardingChecklistsPage() {
  const { edit: canEdit, delete: canDelete } = usePermission(
    MENU_MODULES.ONBOARDING_CHECKLISTS,
  );
  const crud = useMasterCrud<OnboardingChecklistDto, OnboardingChecklistPayload>(
    onboardingChecklistService,
    "Onboarding Checklist",
  );

  return (
    <MasterPageShell
      title="Onboarding Checklists"
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
          emptyMessage="No onboarding checklists found."
          onAdd={crud.openAddDialog}
          addName="Add Checklist"
          onEditRow={canEdit ? crud.openEditDialog : undefined}
          onDeleteRow={canDelete ? crud.handleDelete : undefined}
        />
      </div>

      <MasterFormDialog<OnboardingChecklistDto, OnboardingChecklistPayload>
        open={crud.isAddDialogOpen || crud.isEditDialogOpen}
        onOpenChange={crud.closeDialogs}
        record={crud.editingItem}
        onSave={crud.handleSave}
        isSaving={crud.isSaving}
        serverErrors={crud.saveFieldErrors}
        formError={crud.saveFormError}
        nounSingular="Onboarding Checklist"
      />

      <DeleteAlert
        open={crud.isDeleteAlertOpen}
        onOpenChange={(open) => {
          if (!open) crud.handleCancelDelete();
        }}
        title="Delete Onboarding Checklist"
        description={
          crud.deleteError ||
          `Are you sure you want to delete "${crud.itemToDelete?.name || "this checklist"}"? This action cannot be undone.`
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
