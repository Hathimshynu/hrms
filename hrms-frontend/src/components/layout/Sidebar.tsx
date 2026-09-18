"use client";

import {
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

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
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Organization",
    href: "/organization/departments",
    icon: Users,
    subItems: [
      {
        label: "Departments",
        href: "/organization/departments",
      },
      {
        label: "Designations",
        href: "/organization/designations",
      },
    ],
  },
  {
    label: "People",
    href: "/people",
    icon: Users,
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Leave",
    href: "/leave",
    icon: CalendarClock,
    subItems: [
      {
        label: "Leave",
        href: "/leave",
      },
      {
        label: "Leave Policy",
        href: "/leave/policy",
      },
    ],
  },
  {
    label: "Salary",
    href: "/salary",
    icon: Wallet,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: CalendarClock,
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

  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };

      for (const item of navItems) {
        if (!item.subItems?.length) continue;

        const matches = item.subItems.some((sub) => pathname === sub.href);

        if (matches) {
          next[item.href] = true;
        }
      }

      return next;
    });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
    }
  };

  const handleNavigation = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="top-20! h-[calc(100svh-5rem)]!">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
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
