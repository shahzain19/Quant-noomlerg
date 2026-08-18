"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
  id: number;
  symbol: string;
  name: string;
  sector: string | null;
  changePercent: number | null;
  price: number | null;
}

interface SectorGroup {
  sector: string;
  companies: Company[];
  avgChange: number;
}

export function SectorPanel() {
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d: any[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;

  const groups: Record<string, Company[]> = {};
  for (const c of data) {
    const sector = c.sector ?? "Unknown";
    if (!groups[sector]) groups[sector] = [];
    groups[sector].push(c);
  }

  const sectors: SectorGroup[] = Object.entries(groups)
    .map(([sector, companies]) => {
      const changes = companies.map((c) => c.changePercent ?? 0).filter((v) => v !== 0);
      const avgChange = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
      return { sector, companies, avgChange };
    })
    .sort((a, b) => b.avgChange - a.avgChange);

  return (
    <div className="h-full overflow-auto px-2 py-2 space-y-3">
      {sectors.map((group) => (
        <div key={group.sector}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-zinc-300">{group.sector}</span>
            <span className={cn("text-[10px] font-mono", group.avgChange >= 0 ? "text-green-500" : "text-red-500")}>
              {group.avgChange >= 0 ? "+" : ""}{group.avgChange.toFixed(2)}%
            </span>
          </div>
          <div className="flex gap-0.5 flex-wrap">
            {group.companies.map((c) => {
              const pct = c.changePercent ?? 0;
              const bg = pct >= 2 ? "bg-green-800" : pct >= 0 ? "bg-green-900" : pct >= -2 ? "bg-red-900" : "bg-red-800";
              return (
                <Link
                  key={c.id}
                  href={`/companies/${c.symbol}`}
                  className={`${bg} px-2 py-1 rounded text-[9px] font-mono text-zinc-200 hover:ring-1 hover:ring-white/20 transition-all`}
                >
                  {c.symbol} {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
