"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { formatLargeNumber } from "@/lib/calculations";

interface Company {
  id: number;
  name: string;
  ticker: string;
  sector: string | null;
  marketCap: number | null;
  peRatio: number | null;
}

export function CompaniesPanel() {
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d: Company[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(
    (c) =>
      c.ticker.toLowerCase().includes(filter.toLowerCase()) ||
      c.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="px-2 pt-1 pb-1">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter..."
          className="w-full px-2 py-0.5 text-[11px] bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="text-left py-1 px-2 font-medium">Symbol</th>
              <th className="text-left py-1 px-2 font-medium hidden sm:table-cell">Name</th>
              <th className="text-right py-1 px-2 font-medium">Mkt Cap</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((c) => (
              <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="py-1 px-2">
                  <Link href={`/companies/${c.ticker}`} className="flex items-center gap-1 font-mono text-zinc-100 hover:text-blue-400">
                    <Building2 size={9} className="text-zinc-600" />
                    {c.ticker}
                  </Link>
                </td>
                <td className="py-1 px-2 text-zinc-400 truncate max-w-[100px] hidden sm:table-cell">{c.name}</td>
                <td className="py-1 px-2 text-right font-mono text-zinc-200">{formatLargeNumber(c.marketCap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
