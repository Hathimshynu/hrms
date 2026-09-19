// src/lib/menu/menu.service.ts
import type { MenuItem } from "@/src/permissions/permissions";

import { api } from "../api/axios";

interface MenusResponse {
  success: boolean;
  data: MenuItem[];
}

export const menuService = {
  getMenus: () => api.get<MenusResponse>("/menus").then((res) => res.data.data),
};
