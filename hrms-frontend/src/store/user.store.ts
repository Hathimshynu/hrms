// src/store/user.store.ts
//
// Holds the authenticated user's permission-aware menu (GET /api/menus) -
// the frontend's only source of per-module view/edit/delete access.
// Kept separate from auth.store.ts, which owns session/identity state.
import { create } from "zustand";

import { menuService } from "../lib/menu/menu.service";
import type { MenuItem } from "../permissions/permissions";

interface UserState {
  menus: MenuItem[];
  isLoadingMenus: boolean;
  menuError: string | null;
  hasFetchedMenus: boolean;
  fetchMenus: () => Promise<MenuItem[]>;
  reset: () => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  menus: [],
  isLoadingMenus: false,
  menuError: null,
  hasFetchedMenus: false,

  fetchMenus: async () => {
    if (get().isLoadingMenus) {
      return get().menus;
    }

    set({ isLoadingMenus: true, menuError: null });
    try {
      const menus = await menuService.getMenus();
      set({ menus, isLoadingMenus: false, hasFetchedMenus: true });
      return menus;
    } catch {
      set({
        isLoadingMenus: false,
        hasFetchedMenus: true,
        menuError: "Failed to load menu. Please try again.",
      });
      return [];
    }
  },

  reset: () =>
    set({ menus: [], isLoadingMenus: false, menuError: null, hasFetchedMenus: false }),
}));
