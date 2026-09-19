// src/permissions/roles.ts
//
// Role names come from GET /api/me and POST /login (`roles: string[]` on
// UserResource, backed by the user's single `role_id` - see
// hrms-backend app/Http/Resources/UserResource.php). This is UX-only
// (e.g. showing/hiding a label); actual authorization is per-module via
// src/permissions/can.ts, backed by the same server-computed data.

export function hasRole(roles: string[] | undefined, roleName: string): boolean {
  return !!roles?.includes(roleName);
}

export function hasAnyRole(roles: string[] | undefined, roleNames: string[]): boolean {
  return roleNames.some((roleName) => hasRole(roles, roleName));
}
