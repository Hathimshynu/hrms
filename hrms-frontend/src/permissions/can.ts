// src/permissions/can.ts
import type { MenuAccess, MenuItem } from "./permissions";

const NO_ACCESS: MenuAccess = { view: false, edit: false, delete: false };

// GET /api/menus already excludes any module the user cannot view, so a
// missing entry means "no access" rather than "unknown module".
export function getModuleAccess(menus: MenuItem[], moduleKey: string): MenuAccess {
  return menus.find((menu) => menu.module === moduleKey)?.access ?? NO_ACCESS;
}

export function canView(menus: MenuItem[], moduleKey: string): boolean {
  return getModuleAccess(menus, moduleKey).view;
}

export function canEdit(menus: MenuItem[], moduleKey: string): boolean {
  return getModuleAccess(menus, moduleKey).edit;
}

export function canDelete(menus: MenuItem[], moduleKey: string): boolean {
  return getModuleAccess(menus, moduleKey).delete;
}
