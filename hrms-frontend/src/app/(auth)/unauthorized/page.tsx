"use client";

import Link from "next/link";

import { Button } from "@/src/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <h1 className="text-3xl font-bold text-black">403 — Access denied</h1>
      <p className="max-w-md text-sm text-gray-600">
        You don&apos;t have permission to view this page. If you think this is a
        mistake, contact your administrator.
      </p>
      <Link href="/dashboard">
        <Button variant="outline">Back to dashboard</Button>
      </Link>
    </div>
  );
}
