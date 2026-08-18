"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StockData {
  id: number;
  symbol: string;
  name: string;
  changePercent: number | null;
  marketCap: number | null;
}

export function HeatmapPanel() {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d: StockData[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No data</div>;

  const maxMcap = Math.max(...data.map((d) => d.marketCap ?? 0), 1);

  const getColor = (pct: number | null): string => {
    if (pct == null) return "bg-zinc-800";
    if (pct >= 5) return "bg-green-600";
    if (pct >= 2) return "bg-green-700";
    if (pct >= 0.5) return "bg-green-800";
    if (pct >= -0.5) return "bg-zinc-700";
    if (pct >= -2) return "bg-red-800";
    if (pct >= -5) return "bg-red-700";
    return "bg-red-600";
  };

  return (
    <div className="h-full overflow-auto p-2">
      <div className="flex flex-wrap gap-0.5">
        {data
          .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
          .map((stock) => {
            const mcap = stock.marketCap ?? 0;
            const sizeClass = mcap > maxMcap * 0.5 ? "min-w-[80px] min-h-[60px]" : mcap > maxMcap * 0.2 ? "min-w-[64px] min-h-[48px]" : "min-w-[48px] min-h-[36px]";
            return (
              <Link
                key={stock.id}
                href={`/companies/${stock.symbol}`}
                className={`${getColor(stock.changePercent)} ${sizeClass} flex flex-col items-center justify-center rounded p-1 hover:ring-1 hover:ring-white/20 transition-all`}
              >
                <span className="text-[10px] font-mono font-bold text-white/90">{stock.symbol}</span>
                <span className="text-[9px] font-mono text-white/70">
                  {stock.changePercent != null ? `${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(1)}%` : "—"}
                </span>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
