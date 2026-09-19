// src/hooks/useRole.ts
"use client";

import { useMemo } from "react";

import { hasAnyRole, hasRole } from "../permissions/roles";
import { useAuthStore } from "../store/auth.store";

export function useRole(roleName: string): boolean {
  const roles = useAuthStore((state) => state.user?.roles);
  return useMemo(() => hasRole(roles, roleName), [roles, roleName]);
}

export function useHasAnyRole(roleNames: string[]): boolean {
  const roles = useAuthStore((state) => state.user?.roles);
  return useMemo(() => hasAnyRole(roles, roleNames), [roles, roleNames]);
}

export function useRoles(): string[] {
  return useAuthStore((state) => state.user?.roles ?? []);
}
