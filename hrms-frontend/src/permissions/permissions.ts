// src/permissions/permissions.ts
//
// Types mirror the exact response shape of GET /api/menus
// (hrms-backend app/Http/Controllers/Api/MenuController.php). This is the
// only endpoint that exposes the authenticated user's computed
// view/edit/delete access, so it is the frontend's single permission
// source of truth (see src/store/user.store.ts).

export interface MenuAccess {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export interface MenuItem {
  id: string;
  module: string;
  label: string;
  routePath: string;
  access: MenuAccess;
}

// Module keys exactly as returned by MenuController@index. Not all of
// these have a corresponding frontend page yet - see
// src/permissions/route-permissions.ts for the verified mapping.
export const MENU_MODULES = {
  DASHBOARD: "dashboard",
  EMPLOYEES: "employees",
  DEPARTMENTS: "departments",
  DESIGNATIONS: "designations",
  ATTENDANCE: "attendance",
  LEAVES: "leaves",
  LEAVE_REVIEW: "leaveReview",
  PAYROLL: "payroll",
  PAYROLL_CREATE: "payrollCreate",
  PAYROLL_PROCESS: "payrollProcess",
  REPORTS: "reports",
  REPORTS_EXPORT: "reportsExport",
  USERS: "users",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  EMPLOYEE_DRAFTS: "employeeDrafts",
  BRANCHES: "branches",
  LOCATIONS: "locations",
  LEAVE_POLICIES: "leavePolicies",
  ATTENDANCE_POLICIES: "attendancePolicies",
  WORK_SCHEDULES: "workSchedules",
  SHIFTS: "shifts",
  WEEKLY_OFFS: "weeklyOffs",
  LEAVE_ENTITLEMENTS: "leaveEntitlements",
  LEAVE_ENTITLEMENTS_CREATE: "leaveEntitlementsCreate",
  HOLIDAYS: "holidays",
  HOLIDAYS_CREATE: "holidaysCreate",
  LATE_POLICIES: "latePolicies",
  OVERTIME_POLICIES: "overtimePolicies",
  ONBOARDING_CHECKLISTS: "onboardingChecklists",
} as const;

export type MenuModuleKey = (typeof MENU_MODULES)[keyof typeof MENU_MODULES];
