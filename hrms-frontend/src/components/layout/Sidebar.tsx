"use client";

import {
  AlertCircle,
  BarChart3,
  Boxes,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { useAuth } from "@/src/hooks/useAuth";
import { useMenus } from "@/src/hooks/usePermission";
import { canView } from "@/src/permissions/can";
import { MENU_MODULES, type MenuModuleKey } from "@/src/permissions/permissions";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "../ui/sidebar";

interface SubNavItem {
  label: string;
  href: string;
  // Backend module key this item requires "view" access for (GET
  // /api/menus). Omitted for pages with no backend menu item (not
  // permission-gated - see src/permissions/route-permissions.ts).
  module?: MenuModuleKey;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module?: MenuModuleKey;
  subItems?: SubNavItem[];
}

// Static: labels, icons, and grouping are frontend UX decisions not
// present in GET /api/menus (which returns a flat list). Visibility of
// each item is gated dynamically against the fetched menu below.
const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: MENU_MODULES.DASHBOARD,
  },
  {
    label: "Organization",
    href: "/organization/departments",
    icon: Users,
    subItems: [
      {
        label: "Departments",
        href: "/organization/departments",
        module: MENU_MODULES.DEPARTMENTS,
      },
      {
        label: "Designations",
        href: "/organization/designations",
        module: MENU_MODULES.DESIGNATIONS,
      },
    ],
  },
  {
    label: "People",
    href: "/people",
    icon: Users,
    subItems: [
      {
        label: "Employee List",
        href: "/people",
        module: MENU_MODULES.EMPLOYEES,
      },
      {
        label: "Drafts",
        href: "/people/drafts",
        module: MENU_MODULES.EMPLOYEE_DRAFTS,
      },
    ],
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
    module: MENU_MODULES.ATTENDANCE,
  },
  {
    label: "Leave",
    href: "/leave",
    icon: CalendarClock,
    subItems: [
      {
        label: "Leave",
        href: "/leave",
        module: MENU_MODULES.LEAVES,
      },
      {
        label: "Leave Policy",
        href: "/leave/policy",
        module: MENU_MODULES.LEAVES,
      },
    ],
  },
  {
    label: "Salary",
    href: "/salary",
    icon: Wallet,
    module: MENU_MODULES.PAYROLL,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    module: MENU_MODULES.REPORTS,
  },
  {
    label: "Masters",
    href: "/masters/branches",
    icon: Boxes,
    subItems: [
      { label: "Branches", href: "/masters/branches", module: MENU_MODULES.BRANCHES },
      { label: "Locations", href: "/masters/locations", module: MENU_MODULES.LOCATIONS },
      { label: "Leave Policies", href: "/masters/leave-policies", module: MENU_MODULES.LEAVE_POLICIES },
      { label: "Attendance Policies", href: "/masters/attendance-policies", module: MENU_MODULES.ATTENDANCE_POLICIES },
      { label: "Work Schedules", href: "/masters/work-schedules", module: MENU_MODULES.WORK_SCHEDULES },
      { label: "Shifts", href: "/masters/shifts", module: MENU_MODULES.SHIFTS },
      { label: "Weekly Offs", href: "/masters/weekly-offs", module: MENU_MODULES.WEEKLY_OFFS },
      { label: "Leave Entitlements", href: "/masters/leave-entitlements", module: MENU_MODULES.LEAVE_ENTITLEMENTS },
      { label: "Holidays", href: "/masters/holidays", module: MENU_MODULES.HOLIDAYS },
      { label: "Late Policies", href: "/masters/late-policies", module: MENU_MODULES.LATE_POLICIES },
      { label: "Overtime Policies", href: "/masters/overtime-policies", module: MENU_MODULES.OVERTIME_POLICIES },
      { label: "Onboarding Checklists", href: "/masters/onboarding-checklists", module: MENU_MODULES.ONBOARDING_CHECKLISTS },
    ],
  },
  {
    label: "Access Control",
    href: "/access-control/roles",
    icon: ShieldCheck,
    subItems: [
      { label: "Roles", href: "/access-control/roles", module: MENU_MODULES.ROLES },
      { label: "Permissions", href: "/access-control/permissions", module: MENU_MODULES.PERMISSIONS },
      { label: "Users", href: "/access-control/users", module: MENU_MODULES.USERS },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: CalendarClock,
    // Not part of the backend menu/permission system (personal account
    // settings) - always available once authenticated.
    subItems: [
      {
        label: "Profile Information",
        href: "/settings",
      },
      {
        label: "Account Details",
        href: "/settings/account",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { logout } = useAuth();
  const { menus, isLoadingMenus, menuError, hasFetchedMenus, fetchMenus } = useMenus();

  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

  const visibleNavItems = React.useMemo(() => {
    return ALL_NAV_ITEMS.reduce<NavItem[]>((acc, item) => {
      if (item.subItems?.length) {
        const subItems = item.subItems.filter(
          (sub) => !sub.module || canView(menus, sub.module)
        );
        if (subItems.length > 0) {
          acc.push({ ...item, subItems });
        }
        return acc;
      }

      if (!item.module || canView(menus, item.module)) {
        acc.push(item);
      }
      return acc;
    }, []);
  }, [menus]);

  React.useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };

      for (const item of visibleNavItems) {
        if (!item.subItems?.length) continue;

        const matches = item.subItems.some((sub) => pathname === sub.href);

        if (matches) {
          next[item.href] = true;
        }
      }

      return next;
    });
  }, [pathname, visibleNavItems]);

  const handleLogout = async () => {
    await logout();
  };

  const handleNavigation = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="top-16! h-[calc(100svh-4rem)]!">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {isLoadingMenus && !hasFetchedMenus && (
              <div className="flex flex-col gap-2 px-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-full animate-pulse rounded-lg bg-black/5" />
                ))}
              </div>
            )}

            {menuError && (
              <div className="mx-2 my-2 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{menuError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchMenus()}
                  className="self-start font-semibold underline underline-offset-2 hover:text-red-700"
                >
                  Retry
                </button>
              </div>
            )}

            {hasFetchedMenus && !menuError && visibleNavItems.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No menu items available for your account.
              </p>
            )}

            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const hasSubItems = !!item.subItems && item.subItems.length > 0;

                const isSubActive = hasSubItems
                  ? item.subItems!.some((sub) => pathname === sub.href)
                  : false;

                const isActive =
                  pathname === item.href ||
                  (!hasSubItems && pathname?.startsWith(item.href)) ||
                  isSubActive;

                if (hasSubItems) {
                  const isOpen = openMap[item.href] ?? false;

                  return (
                    <Collapsible
                      key={item.href}
                      open={isOpen}
                      onOpenChange={(open) =>
                        setOpenMap((prev) => ({
                          ...prev,
                          [item.href]: open,
                        }))
                      }
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger
                          render={
                            <SidebarMenuButton
                              isActive={isActive}
                              tooltip={item.label}
                              size="lg"
                              onClick={() => {
                                router.push(item.subItems![0].href);
                                setOpenMobile(false);
                              }}
                            />
                          }
                        >
                          <item.icon className="size-4" />

                          <span>{item.label}</span>

                          <ChevronRight
                            className={`ml-auto size-4 transition-transform duration-200 ease-in-out ${
                              isOpen ? "rotate-90" : "rotate-0"
                            }`}
                          />
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems!.map((sub) => {
                              const isThisSubActive = pathname === sub.href;

                              return (
                                <SidebarMenuSubItem key={sub.href}>
                                  <SidebarMenuSubButton
                                    isActive={isThisSubActive}
                                    render={
                                      <Link
                                        href={sub.href}
                                        onClick={handleNavigation}
                                      />
                                    }
                                    size="lg"
                                  >
                                    <span>{sub.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={
                        <Link href={item.href} onClick={handleNavigation} />
                      }
                      size="lg"
                    >
                      <item.icon className="size-4" />

                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={() => {
                handleLogout();
                handleNavigation();
              }}
              size="lg"
              className="bg-black/50 text-white transition-colors duration-200 hover:bg-black/70 hover:text-white focus-visible:ring-2 focus-visible:ring-red-500/50 dark:bg-white/10 dark:hover:bg-white/20 cursor-pointer"
            >
              <LogOut className="size-4 text-red-500" />

              <span className="font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
