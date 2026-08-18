"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Quote } from "@/types";
import { cn } from "@/lib/utils";

interface Mover {
  id: number;
  symbol: string;
  name: string;
  quote: Quote | null;
}

function formatPrice(p: number | null | undefined): string {
  if (p == null) return "—";
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function MoversPanel() {
  const [data, setData] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d.movers ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            <th className="text-left py-1.5 px-2 font-medium">Symbol</th>
            <th className="text-left py-1.5 px-2 font-medium hidden sm:table-cell">Name</th>
            <th className="text-right py-1.5 px-2 font-medium">Price</th>
            <th className="text-right py-1.5 px-2 font-medium">Chg %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => {
            const pct = m.quote?.changePercent ?? 0;
            const pos = pct >= 0;
            return (
              <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="py-1.5 px-2">
                  <Link href={`/companies/${m.symbol}`} className="font-mono text-zinc-100 hover:text-blue-400">
                    {m.symbol}
                  </Link>
                </td>
                <td className="py-1.5 px-2 text-zinc-400 truncate max-w-[100px] hidden sm:table-cell">{m.name}</td>
                <td className="py-1.5 px-2 text-right font-mono text-zinc-200">{formatPrice(m.quote?.price)}</td>
                <td className="py-1.5 px-2 text-right font-mono">
                  <span className={cn("inline-flex items-center gap-0.5", pos ? "text-green-500" : "text-red-500")}>
                    {pos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {pos ? "+" : ""}{pct.toFixed(2)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
