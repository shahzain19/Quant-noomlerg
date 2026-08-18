"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  TrendingUp,
  Building2,
  Globe,
  Gem,
  Bitcoin,
  BarChart3,
  Star,
  Newspaper,
  Filter,
  Database,
  Terminal,
  Compass,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import type { SearchResult } from "@/types";

const commands = [
  { id: "markets", label: "Open Markets", icon: TrendingUp, href: "/markets" },
  { id: "watchlist", label: "Open Watchlist", icon: Star, href: "/watchlist" },
  { id: "economy", label: "Open Economy", icon: BarChart3, href: "/economy" },
  { id: "screener", label: "Open Screener", icon: Filter, href: "/screener" },
  { id: "data", label: "Import Data", icon: Database, href: "/data" },
  { id: "beginner", label: "Toggle Beginner Mode", icon: Compass, action: "toggleMode" as const },
  { id: "terminal", label: "Toggle Terminal Mode", icon: Terminal, action: "toggleMode" as const },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  company: Building2,
  market: TrendingUp,
  currency: Globe,
  commodity: Gem,
  crypto: Bitcoin,
};

const typeLabels: Record<string, string> = {
  company: "COMPANIES",
  market: "MARKETS",
  currency: "CURRENCIES",
  commodity: "COMMODITIES",
  crypto: "CRYPTO",
};

export function CommandPalette() {
  const { commandOpen, setCommandOpen, toggleMode } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const handleSelect = (href: string) => {
    setCommandOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  const handleCommand = (action: string) => {
    if (action === "toggleMode") {
      toggleMode();
    }
    setCommandOpen(false);
  };

  if (!commandOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setCommandOpen(false)}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <Command
        className="relative w-full max-w-[540px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden"
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Escape") {
            setCommandOpen(false);
          }
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search companies, markets, currencies..."
            className="flex-1 py-3 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          />
          {loading && (
            <span className="text-[11px] text-zinc-500">Searching...</span>
          )}
        </div>

        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-zinc-500">
            {query ? "No results found." : "Type to search..."}
          </Command.Empty>

          {!query && (
            <Command.Group heading="Commands" className="mb-2">
              {commands.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  value={cmd.label}
                  onSelect={() =>
                    cmd.action ? handleCommand(cmd.action) : handleSelect(cmd.href)
                  }
                  className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 rounded cursor-pointer data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-100"
                >
                  <cmd.icon className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="flex-1">{cmd.label}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {Object.entries(grouped).map(([type, items]) => {
            const Icon = typeIcons[type] ?? TrendingUp;
            return (
              <Command.Group
                key={type}
                heading={typeLabels[type] ?? type.toUpperCase()}
                className="mb-2"
              >
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.symbol} ${item.name}`}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 rounded cursor-pointer data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-100"
                  >
                    <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-100 text-[13px]">
                          {item.symbol}
                        </span>
                        <span className="text-zinc-500 truncate text-[12px]">
                          {item.name}
                        </span>
                      </div>
                      {item.subtitle && (
                        <span className="text-[11px] text-zinc-600">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>
      </Command>
    </div>
  );
}
