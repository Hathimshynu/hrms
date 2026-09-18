"use client";

import Image from "next/image";
import Link from "next/link";

import { SidebarTrigger } from "../ui/sidebar";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full">
      <div
        className="
          relative
          flex h-20 w-full items-center gap-3
          bg-surface
          px-4
          shadow-sm
        "
      >
        {/* Only visible on mobile (below md breakpoint) */}
        <SidebarTrigger className="rounded-full md:hidden" />

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/images/hrms_logo.png"
            alt="HRMS"
            width={56}
            height={56}
            className="shrink-0 rounded-xl object-contain"
            priority
          />
        </Link>

        {/* User info */}
        <Link
          href="/settings"
          className="
            ml-auto flex items-center gap-2 sm:gap-3
            px-2 py-1.5 sm:px-2.5 sm:py-2
            rounded-full
            transition-all duration-200 ease-in-out
            active:scale-95
          "
        >
          <Image
            src="/images/profile.jpeg"
            alt="User"
            width={60}
            height={60}
            className="
              size-10 sm:size-13
              shrink-0 rounded-full object-cover
              transition-transform duration-200 ease-in-out
              hover:scale-105
            "
          />
        </Link>
      </div>
    </header>
  );
}
