"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Quote } from "@/types";
import { cn } from "@/lib/utils";

interface MarketItem {
  id: number;
  symbol: string;
  name: string;
  quote: Quote | null;
}

function formatPrice(p: number | null | undefined): string {
  if (p == null) return "—";
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function MarketOverviewPanel() {
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d.markets ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;

  return (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
        {data.map((m) => {
          const pct = m.quote?.changePercent ?? 0;
          const pos = pct >= 0;
          return (
            <Link
              key={m.id}
              href={`/markets/index/${encodeURIComponent(m.symbol)}`}
              className="p-2 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/30 rounded transition-colors"
            >
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{m.symbol}</div>
              <div className="font-mono text-zinc-100 text-[13px] mt-0.5">{formatPrice(m.quote?.price)}</div>
              <div className="flex items-center gap-1 mt-0.5">
                {pos ? <TrendingUp size={10} className="text-green-500" /> : <TrendingDown size={10} className="text-red-500" />}
                <span className={cn("font-mono text-[11px]", pos ? "text-green-500" : "text-red-500")}>
                  {pos ? "+" : ""}{pct.toFixed(2)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
