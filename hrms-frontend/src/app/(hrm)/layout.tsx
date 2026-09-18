"use client";

import Header from "@/src/components/layout/Header";
import { AppSidebar } from "@/src/components/layout/Sidebar";
import { SidebarProvider } from "@/src/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col">
        <Header />

        <div className="flex min-h-0 flex-1 w-full">
          <AppSidebar />

          <main className="relative flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
