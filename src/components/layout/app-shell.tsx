"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { useApp } from "@/components/providers/app-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main
        className={`flex-1 min-h-screen overflow-y-auto transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-[64px]" : "md:pl-[200px]"
        }`}
      >
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
