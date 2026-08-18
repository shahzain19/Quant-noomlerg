"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/panel";
import { ExplainButton } from "@/components/explanations/explain-button";
import { cn } from "@/lib/utils";
import type { Quote, AssetType } from "@/types";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

type TabKey = "all" | "index" | "currency" | "commodity" | "crypto";

const TABS: { key: TabKey; label: string; apiType?: string }[] = [
  { key: "all", label: "All" },
  { key: "index", label: "Indices", apiType: "index" },
  { key: "currency", label: "Currencies", apiType: "currency" },
  { key: "commodity", label: "Commodities", apiType: "commodity" },
  { key: "crypto", label: "Crypto", apiType: "crypto" },
];

interface MarketSecurity {
  id: number;
  symbol: string;
  name: string;
  assetType: string;
  exchange: string | null;
  quote: Quote | null;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(volume: number | null | undefined): string {
  if (volume == null) return "—";
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
  return volume.toFixed(0);
}

function getDetailHref(sec: MarketSecurity): string {
  if (sec.assetType === "equity") return `/companies/${sec.symbol}`;
  return `/markets/${sec.assetType}/${encodeURIComponent(sec.symbol)}`;
}

export function MarketsContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [data, setData] = useState<MarketSecurity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if (activeTab === "all") {
          const types = ["index", "currency", "commodity", "crypto"];
          const results = await Promise.all(
            types.map((t) => fetch(`/api/markets?type=${t}`).then((r) => r.json()))
          );
          if (!cancelled) {
            setData(results.flat());
          }
        } else {
          const tab = TABS.find((t) => t.key === activeTab);
          const res = await fetch(`/api/markets?type=${tab?.apiType ?? activeTab}`);
          const json = await res.json();
          if (!cancelled) {
            setData(json);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-100">Markets</h1>
        <div className="ml-auto">
          <ExplainButton context={{ type: "market", page: "markets" }} />
        </div>
      </div>

      <div className="px-4 pt-2 flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-t transition-colors",
              activeTab === tab.key
                ? "text-zinc-100 bg-zinc-800/60 border-b-2 border-blue-500"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <Panel className="m-3 border-zinc-800">
          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">Loading markets…</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">No securities found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 px-2 font-medium">Symbol</th>
                    <th className="text-left py-2 px-2 font-medium">Name</th>
                    <th className="text-left py-2 px-2 font-medium">Type</th>
                    <th className="text-right py-2 px-2 font-medium">Price</th>
                    <th className="text-right py-2 px-2 font-medium">Change</th>
                    <th className="text-right py-2 px-2 font-medium">Change %</th>
                    <th className="text-right py-2 px-2 font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((sec) => {
                    const q = sec.quote;
                    const positive = (q?.changePercent ?? 0) >= 0;
                    return (
                      <tr
                        key={sec.id}
                        onClick={() => router.push(getDetailHref(sec))}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                      >
                        <td className="py-2 px-2 font-mono font-medium text-zinc-100">
                          {sec.symbol}
                        </td>
                        <td className="py-2 px-2 text-zinc-400 truncate max-w-[200px]">
                          {sec.name}
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded text-[10px] uppercase">
                            {sec.assetType}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-zinc-200">
                          {formatPrice(q?.price)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          {q?.change != null ? (
                            <span className={cn(positive ? "text-green-500" : "text-red-500")}>
                              {positive ? "+" : ""}
                              {q.change.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
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
                        <td className="py-2 px-2 text-right font-mono text-zinc-400">
                          {formatVolume(q?.volume)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
