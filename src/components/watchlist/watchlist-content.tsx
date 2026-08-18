"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { MiniChart } from "@/components/charts";
import type { Quote, PricePoint } from "@/types";
import {
  Plus,
  X,
  Trash2,
  Search,
  List,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Watchlist {
  id: number;
  name: string;
  createdAt: string;
}

interface WatchlistItem {
  id: number;
  sortOrder: number;
  securityId: number;
  symbol: string;
  name: string;
  assetType: string;
  quote: Quote | null;
}

interface WatchlistDetail extends Watchlist {
  items: WatchlistItem[];
}

interface SearchResult {
  id: string;
  type: string;
  symbol: string;
  name: string;
  subtitle?: string;
  href: string;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WatchlistContent() {
  const router = useRouter();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<WatchlistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [showAddSearch, setShowAddSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const [sparklineData, setSparklineData] = useState<Record<string, PricePoint[]>>({});

  const loadWatchlists = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlists");
      const data = await res.json();
      setWatchlists(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/watchlists?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
        for (const item of data.items) {
          if (!sparklineData[item.symbol]) {
            fetch(`/api/companies/${item.symbol}/prices?range=1M`)
              .then((r) => r.json())
              .then((prices: PricePoint[]) => {
                if (prices.length > 0) {
                  setSparklineData((prev) => ({ ...prev, [item.symbol]: prices }));
                }
              })
              .catch(() => {});
          }
        }
      } else {
        setDetail(null);
      }
    } finally {
      setDetailLoading(false);
    }
  }, [sparklineData]);

  useEffect(() => {
    void loadWatchlists();
  }, [loadWatchlists]);

  useEffect(() => {
    if (selectedId) {
      setDetailLoading(true);
      void loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!showAddSearch || !searchQuery.trim()) {
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((data: SearchResult[]) => setSearchResults(data))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showAddSearch]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newName.trim() }),
      });
      const wl = await res.json();
      setWatchlists((prev) => [...prev, wl]);
      setSelectedId(wl.id);
      setNewName("");
      setShowCreateInput(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
    if (selectedId === id) {
      setSelectedId(watchlists.find((w) => w.id !== id)?.id ?? null);
    }
    setConfirmDelete(null);
  }

  async function handleAdd(security: SearchResult) {
    if (!selectedId) return;
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", watchlistId: selectedId, symbol: security.symbol }),
    });
    setShowAddSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    loadDetail(selectedId);
  }

  async function handleRemove(securityId: number) {
    if (!selectedId) return;
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", watchlistId: selectedId, securityId }),
    });
    loadDetail(selectedId);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-100">Watchlist</h1>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-48 border-r border-zinc-800 flex flex-col">
          <div className="p-2 border-b border-zinc-800">
            <button
              onClick={() => setShowCreateInput(!showCreateInput)}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
            >
              <Plus size={12} />
              New Watchlist
            </button>
            {showCreateInput && (
              <div className="mt-2 flex gap-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Name…"
                  className="flex-1 px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="px-2 py-1 text-[11px] text-zinc-100 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
                >
                  {creating ? "…" : "OK"}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto py-1">
            {loading ? (
              <div className="px-3 py-4 text-xs text-zinc-500">Loading…</div>
            ) : watchlists.length === 0 ? (
              <div className="px-3 py-4 text-xs text-zinc-500">No watchlists yet</div>
            ) : (
              watchlists.map((wl) => (
                <div
                  key={wl.id}
                  className={cn(
                    "group flex items-center gap-1 px-2 py-1.5 mx-1 rounded cursor-pointer text-xs",
                    selectedId === wl.id
                      ? "bg-zinc-800/60 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"
                  )}
                  onClick={() => setSelectedId(wl.id)}
                >
                  <List size={12} className="shrink-0" />
                  <span className="flex-1 truncate">{wl.name}</span>
                  {confirmDelete === wl.id ? (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(wl.id);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(null);
                        }}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(wl.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              Select a watchlist
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              Loading…
            </div>
          ) : detail ? (
            <>
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200">{detail.name}</span>
                <span className="text-[10px] text-zinc-500">
                  {detail.items.length} item{detail.items.length !== 1 ? "s" : ""}
                </span>
                <div className="ml-auto">
                  {showAddSearch ? (
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <Search
                          size={12}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500"
                        />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search symbol or name…"
                          className="pl-6 pr-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 w-56"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => {
                          setShowAddSearch(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="text-zinc-500 hover:text-zinc-300 p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddSearch(true)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                    >
                      <Plus size={12} />
                      Add Security
                    </button>
                  )}
                </div>
              </div>

              {showAddSearch && searchResults.length > 0 && (
                <div className="mx-4 mt-1 border border-zinc-700 bg-zinc-900 rounded max-h-48 overflow-auto">
                  {searchResults.map((sr) => (
                    <button
                      key={sr.id}
                      onClick={() => handleAdd(sr)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-800 transition-colors text-left"
                    >
                      <span className="font-mono font-medium text-zinc-200">{sr.symbol}</span>
                      <span className="text-zinc-500 truncate">{sr.name}</span>
                      <span className="ml-auto text-[10px] text-zinc-600 uppercase">{sr.type}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-auto">
                {detail.items.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
                    No items in this watchlist
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800">
                        <th className="text-left py-2 px-4 font-medium">Symbol</th>
                        <th className="text-left py-2 px-4 font-medium">Name</th>
                        <th className="text-right py-2 px-4 font-medium">Price</th>
                        <th className="text-right py-2 px-4 font-medium">Change %</th>
                        <th className="text-center py-2 px-4 font-medium w-16">Trend</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item) => {
                        const q = item.quote;
                        const positive = (q?.changePercent ?? 0) >= 0;
                        const sparkData = sparklineData[item.symbol] ?? [];
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="py-2 px-4">
                              <button
                                onClick={() =>
                                  item.assetType === "equity"
                                    ? router.push(`/companies/${item.symbol}`)
                                    : router.push(
                                        `/markets/${item.assetType}/${encodeURIComponent(item.symbol)}`
                                      )
                                }
                                className="font-mono font-medium text-zinc-100 hover:text-blue-400 transition-colors"
                              >
                                {item.symbol}
                              </button>
                            </td>
                            <td className="py-2 px-4 text-zinc-400 truncate max-w-[200px]">
                              {item.name}
                            </td>
                            <td className="py-2 px-4 text-right font-mono text-zinc-200">
                              {formatPrice(q?.price)}
                            </td>
                            <td className="py-2 px-4 text-right font-mono">
                              {q?.changePercent != null ? (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-0.5",
                                    positive ? "text-green-500" : "text-red-500"
                                  )}
                                >
                                  {positive ? (
                                    <ArrowUpRight size={10} />
                                  ) : (
                                    <ArrowDownRight size={10} />
                                  )}
                                  {positive ? "+" : ""}
                                  {q.changePercent.toFixed(2)}%
                                </span>
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                            <td className="py-2 px-4 flex justify-center">
                              {sparkData.length > 0 && <div className="w-[60px] h-[24px]"><MiniChart data={sparkData} /></div>}
                            </td>
                            <td className="py-2 px-1">
                              <button
                                onClick={() => handleRemove(item.securityId)}
                                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                                title="Remove from watchlist"
                              >
                                <X size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              Watchlist not found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
