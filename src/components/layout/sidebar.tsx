"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Star,
  Newspaper,
  BarChart3,
  Filter,
  Database,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Markets", icon: TrendingUp, href: "/markets" },
  { label: "Companies", icon: Building2, href: "/companies" },
  { label: "Watchlist", icon: Star, href: "/watchlist" },
  { label: "News", icon: Newspaper, href: "/news" },
  { label: "Economy", icon: BarChart3, href: "/economy" },
  { label: "Screener", icon: Filter, href: "/screener" },
  { label: "Data Center", icon: Database, href: "/data" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { setCommandOpen, sidebarCollapsed, toggleSidebar } = useApp();

  return (
    <aside
      className={`hidden md:flex fixed inset-y-0 left-0 flex-col bg-zinc-950 border-r border-zinc-800 transition-all duration-300 z-30 ${
        sidebarCollapsed ? "w-[64px]" : "w-[200px]"
      }`}
    >
      <div className="flex items-center justify-between h-12 px-3.5 border-b border-zinc-800">
        {!sidebarCollapsed ? (
          <span className="text-zinc-200 font-mono font-bold text-sm uppercase tracking-widest truncate">
            ATLAS
          </span>
        ) : (
          <span className="text-blue-500 font-mono font-bold text-base mx-auto">
            A
          </span>
        )}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3.5 py-2 text-[13px] transition-colors ${
                sidebarCollapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "text-zinc-100 bg-zinc-800/60 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCommandOpen(true)}
        title={sidebarCollapsed ? "Search (Ctrl+K)" : undefined}
        className={`flex items-center gap-2 px-3.5 py-3 border-t border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-[12px] cursor-pointer ${
          sidebarCollapsed ? "justify-center px-0" : ""
        }`}
      >
        {!sidebarCollapsed ? (
          <>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono border border-zinc-700 rounded bg-zinc-800 text-zinc-400">
              Ctrl+K
            </kbd>
            <span className="truncate">Search</span>
          </>
        ) : (
          <Search className="w-4 h-4 shrink-0 text-zinc-400" />
        )}
      </button>
    </aside>
  );
}
