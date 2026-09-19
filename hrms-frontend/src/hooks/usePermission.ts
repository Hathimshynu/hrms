// src/hooks/usePermission.ts
"use client";

import { useMemo } from "react";

import { canDelete, canEdit, canView } from "../permissions/can";
import type { MenuAccess, MenuModuleKey } from "../permissions/permissions";
import { useUserStore } from "../store/user.store";

// Centralized permission check. Backed entirely by GET /api/menus - see
// src/store/user.store.ts. This is UX-only; the Laravel backend enforces
// authorization on every request regardless of what this returns.
export function usePermission(moduleKey: MenuModuleKey): MenuAccess {
  const menus = useUserStore((state) => state.menus);

  return useMemo(
    () => ({
      view: canView(menus, moduleKey),
      edit: canEdit(menus, moduleKey),
      delete: canDelete(menus, moduleKey),
    }),
    [menus, moduleKey]
  );
}

export function useMenus() {
  const menus = useUserStore((state) => state.menus);
  const isLoadingMenus = useUserStore((state) => state.isLoadingMenus);
  const menuError = useUserStore((state) => state.menuError);
  const hasFetchedMenus = useUserStore((state) => state.hasFetchedMenus);
  const fetchMenus = useUserStore((state) => state.fetchMenus);

  return { menus, isLoadingMenus, menuError, hasFetchedMenus, fetchMenus };
}
