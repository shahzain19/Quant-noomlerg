"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { MiniChart } from "@/components/charts";
import { cn } from "@/lib/utils";
import type { Quote, PricePoint } from "@/types";

interface CurrencyItem {
  id: number;
  symbol: string;
  name: string;
  quote: Quote | null;
  sparkline: PricePoint[];
}

function formatPrice(p: number | null | undefined): string {
  if (p == null) return "—";
  return p.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 4 });
}

export function CurrenciesPanel() {
  const [data, setData] = useState<CurrencyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/markets?type=currency");
        const secs = await res.json();
        const enriched = await Promise.all(
          secs.map(async (s: any) => {
            let sparkline: PricePoint[] = [];
            try {
              const pr = await fetch(`/api/companies/${s.symbol}/prices?range=1M`);
              sparkline = await pr.json();
            } catch {}
            return { ...s, sparkline };
          })
        );
        setData(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No currencies</div>;

  return (
    <div className="h-full overflow-auto p-2 space-y-2">
      {data.map((item) => {
        const pct = item.quote?.changePercent ?? 0;
        const pos = pct >= 0;
        return (
          <div key={item.id} className="border border-zinc-800 bg-zinc-900/50 rounded p-2 hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.symbol}</div>
                <div className="font-mono text-zinc-100 text-[13px]">{formatPrice(item.quote?.price)}</div>
              </div>
              <div className="flex items-center gap-1">
                {pos ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                <span className={cn("font-mono text-[11px]", pos ? "text-green-500" : "text-red-500")}>
                  {pos ? "+" : ""}{pct.toFixed(2)}%
                </span>
              </div>
            </div>
            {item.sparkline.length > 0 && (
              <div className="h-8 w-full">
                <MiniChart data={item.sparkline} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
