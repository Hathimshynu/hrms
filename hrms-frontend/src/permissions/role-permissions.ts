// src/permissions/role-permissions.ts
//
// Intentionally left without a role -> permission map.
//
// The backend computes permissions per user dynamically from a DB-backed
// role_has_permissions pivot (hrms-backend app/Models/Role.php,
// User::can() in app/Models/User.php) - there is no fixed, static
// role -> permission table, and roles/permissions can be edited via
// /api/roles at any time. Hardcoding an equivalent map here would
// duplicate backend RBAC state on the client and drift out of sync with
// real changes, which the project rules explicitly warn against
// ("do not invent permissions/roles", "do not duplicate backend
// permission state unnecessarily").
//
// The frontend's permission source of truth is GET /api/menus, which
// already returns the current user's computed view/edit/delete access
// per module - see src/permissions/can.ts and src/store/user.store.ts.
export {};
