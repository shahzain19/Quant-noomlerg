"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { MiniChart } from "@/components/charts/mini-chart";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/types";

interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  sparkline: PricePoint[];
}

function formatPrice(p: number | null | undefined): string {
  if (p == null) return "—";
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WatchlistPanel() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const wlRes = await fetch("/api/watchlists");
        const wls = await wlRes.json();
        if (!wls.length) { setLoading(false); return; }
        const detailRes = await fetch(`/api/watchlists?id=${wls[0].id}`);
        if (!detailRes.ok) { setLoading(false); return; }
        const detail = await detailRes.json();
        const enriched = await Promise.all(
          (detail.items ?? []).map(async (item: { id: number; symbol: string; name: string; quote: { price: number; changePercent: number } | null }) => {
            let sparkline: PricePoint[] = [];
            try {
              const pr = await fetch(`/api/companies/${item.symbol}/prices?range=1M`);
              sparkline = await pr.json();
            } catch {}
            return { ...item, price: item.quote?.price ?? null, changePercent: item.quote?.changePercent ?? null, sparkline };
          })
        );
        setItems(enriched);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;
  if (!items.length) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No watchlist items</div>;

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            <th className="text-left py-1.5 px-2 font-medium">Symbol</th>
            <th className="text-right py-1.5 px-2 font-medium">Price</th>
            <th className="text-right py-1.5 px-2 font-medium">Chg %</th>
            <th className="text-center py-1.5 px-2 font-medium w-16">Trend</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const pct = item.changePercent ?? 0;
            const pos = pct >= 0;
            return (
              <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="py-1.5 px-2">
                  <Link href={`/companies/${item.symbol}`} className="font-mono text-zinc-100 hover:text-blue-400">
                    {item.symbol}
                  </Link>
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-zinc-200">{formatPrice(item.price)}</td>
                <td className="py-1.5 px-2 text-right font-mono">
                  <span className={cn("inline-flex items-center gap-0.5", pos ? "text-green-500" : "text-red-500")}>
                    {pos ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                    {pos ? "+" : ""}{pct.toFixed(2)}%
                  </span>
                </td>
                <td className="py-1 px-2">
                  <div className="h-5 w-full">
                    {item.sparkline.length > 0 && <MiniChart data={item.sparkline} />}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
