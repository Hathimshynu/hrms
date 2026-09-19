// src/permissions/route-permissions.ts
//
// Maps this app's ACTUAL Next.js routes to the backend module key that
// gates them, per GET /api/menus.
//
// Route reconciliation (Phase 2, Step 3):
// MenuController returns routePath values like "/admin/employees" that do
// NOT match any real route in this app (routes are "/people",
// "/organization/departments", etc). Renaming this app's existing,
// working routes to match "/admin/*" would touch every page in the HRM
// area for a cosmetic path and contradicts "do not rename working
// routes" / "preserve existing UI/UX" - so routePath is NOT used for
// navigation. Instead we join on the stable `module` key (e.g.
// "departments") and keep our own verified route mapping here. If the
// backend routePath values are meant to be authoritative, that's a
// backend change to propose separately, not something to guess at here.
//
// | module       | backend routePath   | frontend route              | status                              |
// |--------------|----------------------|------------------------------|-------------------------------------|
// | dashboard    | /admin/dashboard     | /dashboard                   | mapped by module key                |
// | employees    | /admin/employees     | /people                      | mapped by module key                |
// | departments  | /admin/departments   | /organization/departments    | mapped by module key                |
// | designations | /admin/designations  | /organization/designations   | mapped by module key                |
// | attendance   | /admin/attendance    | /attendance                  | mapped by module key                |
// | leaves       | /admin/leaves        | /leave, /leave/policy        | mapped by module key (single perm.  |
// |              |                       |                               | covers both; no separate "policy"   |
// |              |                       |                               | permission exists on the backend)   |
// | payroll      | /admin/payroll       | /salary                      | mapped by module key; labels differ |
// |              |                       |                               | ("Payroll" vs "Salary") - flagged,  |
// |              |                       |                               | not renamed, see phase report       |
// | reports      | /admin/reports       | (none)                       | BACKEND GAP - no report endpoints, no frontend page (Phase 8) |
// | users        | /admin/users         | /access-control/users        | mapped by module key (Phase 8)      |
// | roles        | /admin/roles         | /access-control/roles        | mapped by module key (Phase 8)      |
// | permissions  | /admin/permissions   | /access-control/permissions  | mapped by module key (Phase 8)      |
// | employeeDrafts | /people/drafts     | /people/drafts               | mapped by module key (Phase 8)      |
// | branches     | /masters/branches    | /masters/branches            | read-only, no backend CRUD (Phase 8)|
// | locations    | /masters/locations   | /masters/locations           | read-only, no backend CRUD (Phase 8)|
// | leavePolicies| /masters/leave-policies | /masters/leave-policies   | mapped by module key (Phase 8)      |
// | attendancePolicies | /masters/attendance-policies | /masters/attendance-policies | mapped by module key (Phase 8) |
// | workSchedules| /masters/work-schedules | /masters/work-schedules   | mapped by module key (Phase 8)      |
// | shifts       | /masters/shifts      | /masters/shifts              | mapped by module key (Phase 8)      |
// | weeklyOffs   | /masters/weekly-offs | /masters/weekly-offs         | mapped by module key (Phase 8)      |
// | latePolicies | /masters/late-policies | /masters/late-policies     | mapped by module key (Phase 8)      |
// | overtimePolicies | /masters/overtime-policies | /masters/overtime-policies | mapped by module key (Phase 8) |
// | onboardingChecklists | /masters/onboarding-checklists | /masters/onboarding-checklists | mapped by module key (Phase 8) |
// | (none)       | (none)                | /settings, /settings/account | frontend page, no backend menu item |
// | (none)       | (none)                | /change-password              | frontend page, no backend menu item |
//
// Routes with no entry here are NOT gated by a module permission - they
// only require authentication (enforced by AuthGuard).
import { MENU_MODULES, type MenuModuleKey } from "./permissions";

export const ROUTE_MODULE_MAP: Record<string, MenuModuleKey> = {
  "/dashboard": MENU_MODULES.DASHBOARD,
  "/people": MENU_MODULES.EMPLOYEES,
  "/people/drafts": MENU_MODULES.EMPLOYEE_DRAFTS,
  "/organization/departments": MENU_MODULES.DEPARTMENTS,
  "/organization/designations": MENU_MODULES.DESIGNATIONS,
  "/attendance": MENU_MODULES.ATTENDANCE,
  "/leave": MENU_MODULES.LEAVES,
  "/leave/policy": MENU_MODULES.LEAVES,
  "/salary": MENU_MODULES.PAYROLL,
  "/access-control/users": MENU_MODULES.USERS,
  "/access-control/roles": MENU_MODULES.ROLES,
  "/access-control/permissions": MENU_MODULES.PERMISSIONS,
  "/masters/branches": MENU_MODULES.BRANCHES,
  "/masters/locations": MENU_MODULES.LOCATIONS,
  "/masters/leave-policies": MENU_MODULES.LEAVE_POLICIES,
  "/masters/attendance-policies": MENU_MODULES.ATTENDANCE_POLICIES,
  "/masters/work-schedules": MENU_MODULES.WORK_SCHEDULES,
  "/masters/shifts": MENU_MODULES.SHIFTS,
  "/masters/weekly-offs": MENU_MODULES.WEEKLY_OFFS,
  "/masters/late-policies": MENU_MODULES.LATE_POLICIES,
  "/masters/overtime-policies": MENU_MODULES.OVERTIME_POLICIES,
  "/masters/onboarding-checklists": MENU_MODULES.ONBOARDING_CHECKLISTS,
};

export function getRequiredModuleForPath(pathname: string): MenuModuleKey | null {
  if (ROUTE_MODULE_MAP[pathname]) return ROUTE_MODULE_MAP[pathname];

  // Fallback for nested dynamic routes (e.g. /access-control/roles/[id]/permissions)
  // that have no exact entry above - match the longest mapped prefix.
  const prefixMatch = Object.keys(ROUTE_MODULE_MAP)
    .filter((route) => pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];

  return prefixMatch ? ROUTE_MODULE_MAP[prefixMatch] : null;
}
