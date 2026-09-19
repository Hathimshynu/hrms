// src/app/(hrm)/masters/components/MasterPageShell.tsx
//
// Shared page chrome (back button + title + banners) for all 10 masters
// pages, factored out of the header block in
// src/app/(hrm)/organization/departments/page.tsx so it isn't repeated
// verbatim 10 times.
"use client";

import { InlineBanner } from "@/src/components/common/InlineBanner";
import { ArrowLeft } from "lucide-react";
import * as React from "react";

interface MasterPageShellProps {
  title: string;
  note?: string;
  successMessage?: string | null;
  errorMessage?: string | null;
  children: React.ReactNode;
}

export function MasterPageShell({
  title,
  note,
  successMessage,
  errorMessage,
  children,
}: MasterPageShellProps) {
  return (
    <div className="min-h-screen w-full py-4 px-3 sm:px-6 lg:px-8 bg-[#F2F2F2] grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-3 items-center min-w-0">
          <button type="button" aria-label="Go back"
            className="group flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary sm:h-10 sm:w-10"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 text-black group-hover:text-white" />
          </button>
          <h1 className="text-lg sm:text-2xl font-light truncate">{title}</h1>
        </div>
      </div>

      {note && <p className="-mt-2 text-sm text-gray-500">{note}</p>}

      {successMessage && <InlineBanner type="success" message={successMessage} />}
      {errorMessage && <InlineBanner type="error" message={errorMessage} />}

      {children}
    </div>
  );
}
