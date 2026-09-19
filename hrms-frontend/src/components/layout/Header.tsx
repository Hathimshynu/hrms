"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserAvatar } from "@/src/components/common/UserAvatar";
import { useAuth } from "@/src/hooks/useAuth";

import { SidebarTrigger } from "../ui/sidebar";

function toLabel(segment: string) {
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const { user } = useAuth();

  // Breadcrumb from the real route segments (skip dynamic numeric ids).
  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .filter((s) => !/^\d+$/.test(s));

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-surface/90 backdrop-blur supports-backdrop-filter:bg-surface/75">
      <div className="flex h-16 w-full items-center gap-3 px-4">
        <SidebarTrigger className="rounded-full md:hidden" />

        <Link href="/dashboard" className="flex shrink-0 items-center gap-2" prefetch>
          <Image
            src="/images/hrms_logo.png"
            alt="HATHIM HRMS"
            width={44}
            height={44}
            className="shrink-0 rounded-xl object-contain"
            priority
          />
        </Link>

        <nav aria-label="Breadcrumb" className="ml-2 hidden min-w-0 items-center gap-1 text-sm sm:flex">
          {crumbs.map((c, i) => (
            <span key={`${c}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
              <span
                className={
                  i === crumbs.length - 1
                    ? "truncate font-semibold text-foreground"
                    : "truncate text-muted-foreground"
                }
                aria-current={i === crumbs.length - 1 ? "page" : undefined}
              >
                {toLabel(c)}
              </span>
            </span>
          ))}
        </nav>

        <Link
          href="/settings"
          className="ml-auto flex items-center gap-3 rounded-full py-1 pr-1 pl-3 transition-colors duration-200 hover:bg-black/5 active:scale-95"
        >
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-sm font-semibold text-foreground">{user?.name ?? ""}</span>
            <span className="block text-xs text-muted-foreground">{user?.roles?.[0] ?? ""}</span>
          </span>
          <UserAvatar name={user?.name} className="size-10 ring-2 ring-white transition-transform duration-200 hover:scale-105" />
        </Link>
      </div>
    </header>
  );
}
