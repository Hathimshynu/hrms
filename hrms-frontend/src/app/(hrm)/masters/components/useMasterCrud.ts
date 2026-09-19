// src/app/(hrm)/masters/components/useMasterCrud.ts
//
// Shared list+dialog+delete state machine for the 8 CRUD "employee
// master" pages, mirroring the working pattern in
// src/app/(hrm)/organization/departments/page.tsx (load list, add/edit
// dialog with server field errors, delete confirmation, inline success
// banner). Extracted here since all 8 masters repeat the exact same
// state/handlers and only differ in their DTO/payload shape and copy.
"use client";

import { parseApiError } from "@/src/lib/api/errors";
import type { BaseMasterDto, BaseMasterPayload, MasterService } from "@/src/lib/masters/master.service";
import * as React from "react";

export function useMasterCrud<
  TDto extends BaseMasterDto,
  TPayload extends BaseMasterPayload,
>(service: MasterService<TDto, TPayload>, nounSingular: string) {
  const [items, setItems] = React.useState<TDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [editingItem, setEditingItem] = React.useState<TDto | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveFormError, setSaveFormError] = React.useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = React.useState<Record<string, string>>({});

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<TDto | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const loadItems = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await service.list();
      setItems(data);
    } catch (err) {
      setLoadError(
        parseApiError(err, `Failed to load ${nounSingular.toLowerCase()}s.`).message,
      );
    } finally {
      setIsLoading(false);
    }
    // service is a stable module-level object for every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nounSingular]);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  React.useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const openAddDialog = React.useCallback(() => {
    setEditingItem(null);
    setSaveFormError(null);
    setSaveFieldErrors({});
    setIsAddDialogOpen(true);
  }, []);

  const openEditDialog = React.useCallback((item: TDto) => {
    setEditingItem(item);
    setSaveFormError(null);
    setSaveFieldErrors({});
    setIsEditDialogOpen(true);
  }, []);

  const closeDialogs = React.useCallback((open: boolean) => {
    if (!open) {
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingItem(null);
    }
  }, []);

  const handleSave = React.useCallback(
    async (payload: TPayload) => {
      setIsSaving(true);
      setSaveFormError(null);
      setSaveFieldErrors({});
      try {
        if (editingItem) {
          await service.update(editingItem.id, payload);
          setSuccessMessage(`${nounSingular} updated successfully.`);
        } else {
          await service.create(payload);
          setSuccessMessage(`${nounSingular} created successfully.`);
        }
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingItem(null);
        await loadItems();
      } catch (err) {
        const { message, fieldErrors } = parseApiError(
          err,
          `Failed to save ${nounSingular.toLowerCase()}.`,
        );
        if (Object.keys(fieldErrors).length > 0) {
          setSaveFieldErrors(fieldErrors);
        } else {
          setSaveFormError(message);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [editingItem, nounSingular, service, loadItems],
  );

  const handleDelete = React.useCallback((item: TDto) => {
    setItemToDelete(item);
    setDeleteError(null);
    setIsDeleteAlertOpen(true);
  }, []);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await service.remove(itemToDelete.id);
      setSuccessMessage(`${nounSingular} deleted successfully.`);
      setIsDeleteAlertOpen(false);
      setItemToDelete(null);
      await loadItems();
    } catch (err) {
      setDeleteError(
        parseApiError(err, `Failed to delete ${nounSingular.toLowerCase()}.`).message,
      );
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, nounSingular, service, loadItems]);

  const handleCancelDelete = React.useCallback(() => {
    if (isDeleting) return;
    setIsDeleteAlertOpen(false);
    setItemToDelete(null);
    setDeleteError(null);
  }, [isDeleting]);

  return {
    items,
    isLoading,
    loadError,
    successMessage,
    editingItem,
    isAddDialogOpen,
    isEditDialogOpen,
    isSaving,
    saveFormError,
    saveFieldErrors,
    isDeleteAlertOpen,
    itemToDelete,
    isDeleting,
    deleteError,
    openAddDialog,
    openEditDialog,
    closeDialogs,
    handleSave,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
