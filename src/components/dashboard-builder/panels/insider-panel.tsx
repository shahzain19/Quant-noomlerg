"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsiderTrade {
  id: number;
  ticker: string;
  insiderName: string;
  title: string | null;
  transactionType: string;
  shares: number | null;
  price: number | null;
  totalValue: number | null;
  filedAt: string;
}

export function InsiderPanel() {
  const [data, setData] = useState<InsiderTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/companies?include=insider")
      .then((r) => r.json())
      .then(async () => {
        // Fetch from a dedicated endpoint or use existing data
        const res = await fetch("/api/economy?type=insider");
        const d = await res.json();
        setData(d);
      })
      .catch(() => {
        // Fallback: try the filings endpoint
        fetch("/api/economy?type=insider_transactions")
          .then((r) => r.json())
          .then((d: InsiderTrade[]) => setData(d))
          .catch(() => setData([]))
          .finally(() => setLoading(false));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading insider transactions...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No insider transactions found</div>;

  return (
    <div className="h-full overflow-auto divide-y divide-zinc-800/50">
      {data.slice(0, 30).map((trade) => {
        const isBuy = trade.transactionType === "buy" || trade.transactionType === "grant";
        return (
          <div key={trade.id} className="px-2 py-2 hover:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0", isBuy ? "bg-green-500/20" : "bg-red-500/20")}>
                {isBuy ? <TrendingUp size={10} className="text-green-400" /> : <TrendingDown size={10} className="text-red-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/companies/${trade.ticker}`} className="text-[10px] font-mono text-zinc-400 hover:text-blue-400">
                    {trade.ticker}
                  </Link>
                  <span className="text-[10px] text-zinc-300 truncate">{trade.insiderName}</span>
                  {trade.title && <span className="text-[9px] text-zinc-600">({trade.title})</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-[9px] font-medium uppercase", isBuy ? "text-green-400" : "text-red-400")}>
                    {trade.transactionType}
                  </span>
                  {trade.shares && (
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {trade.shares.toLocaleString()} shares
                    </span>
                  )}
                  {trade.price && (
                    <span className="text-[9px] text-zinc-500 font-mono">
                      @${trade.price.toFixed(2)}
                    </span>
                  )}
                  {trade.totalValue && (
                    <span className="text-[9px] text-zinc-400 font-mono">
                      (${Math.abs(trade.totalValue) >= 1e6 ? `${(trade.totalValue / 1e6).toFixed(1)}M` : `${(trade.totalValue / 1e3).toFixed(0)}K`})
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-zinc-600 font-mono shrink-0">
                {new Date(trade.filedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
