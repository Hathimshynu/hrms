// src/components/auth/AuthGuard.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useMenus } from "@/src/hooks/usePermission";
import { getRequiredModuleForPath } from "@/src/permissions/route-permissions";
import { useAuthStore } from "@/src/store/auth.store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, fetchCurrentUser } = useAuthStore();
  const { menus, menuError, hasFetchedMenus, fetchMenus } = useMenus();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;
    // Persisted session hint: start /menus in parallel with /me instead of
    // waiting for /me first (removes one serial round-trip on load).
    const persisted = useAuthStore.getState();
    if (persisted.isAuthenticated && !persisted.user?.must_change_password) {
      void fetchMenus();
    }
    fetchCurrentUser().finally(() => {
      if (active) setAuthChecked(true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passedAuthCheck = authChecked && isAuthenticated && !user?.must_change_password;

  useEffect(() => {
    if (passedAuthCheck && !hasFetchedMenus) {
      fetchMenus();
    }
  }, [passedAuthCheck, hasFetchedMenus, fetchMenus]);

  useEffect(() => {
    if (!authChecked) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.must_change_password && pathname !== "/change-password") {
      router.replace("/change-password");
      return;
    }

    if (!hasFetchedMenus || menuError) {
      // A transient menu-fetch failure shouldn't lock a user out of a page
      // they may be allowed to view - the backend still authorizes every
      // real API call regardless of this client-side check.
      return;
    }

    const requiredModule = getRequiredModuleForPath(pathname);
    if (requiredModule) {
      const allowed = menus.some(
        (menu) => menu.module === requiredModule && menu.access.view
      );
      if (!allowed) {
        router.replace("/unauthorized");
      }
    }
  }, [authChecked, isAuthenticated, user, pathname, router, hasFetchedMenus, menuError, menus]);

  const ready = passedAuthCheck && hasFetchedMenus;

  // Don't mount a page (and fire its API calls) for a module the user can't
  // view - the redirect effect above sends them to /unauthorized.
  const requiredModule = hasFetchedMenus && !menuError ? getRequiredModuleForPath(pathname) : null;
  const denied =
    !!requiredModule &&
    !menus.some((menu) => menu.module === requiredModule && menu.access.view);

  if (!authChecked || !isAuthenticated || user?.must_change_password || !ready || denied) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black" />
      </div>
    );
  }

  return <>{children}</>;
}
