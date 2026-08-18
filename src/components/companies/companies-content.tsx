"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { Panel, NoData } from "@/components/ui/panel";
import { formatLargeNumber } from "@/lib/calculations";

interface Company {
  id: number;
  name: string;
  ticker: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  peRatio: number | null;
}

export function CompaniesContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then(setCompanies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.ticker.toLowerCase().includes(filter.toLowerCase()) ||
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      (c.sector && c.sector.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">Companies</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter companies..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-[13px] bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-zinc-600 w-64"
          />
        </div>
      </div>

      <Panel>
        {loading ? (
          <div className="py-8 text-center text-zinc-500 text-sm">Loading companies...</div>
        ) : filtered.length === 0 ? (
          <NoData message="No companies found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Sector</th>
                  <th className="pb-2 font-medium">Exchange</th>
                  <th className="pb-2 font-medium text-right">Market Cap</th>
                  <th className="pb-2 font-medium text-right">P/E</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="py-2">
                      <Link
                        href={`/companies/${c.ticker}`}
                        className="flex items-center gap-2 font-mono text-zinc-100 text-[13px] hover:text-blue-400 transition-colors"
                      >
                        <Building2 className="w-3 h-3 text-zinc-600" />
                        {c.ticker}
                      </Link>
                    </td>
                    <td className="py-2 text-zinc-400 text-[13px] truncate max-w-[200px]">
                      {c.name}
                    </td>
                    <td className="py-2 text-zinc-500 text-[12px]">{c.sector || "—"}</td>
                    <td className="py-2 text-zinc-500 text-[12px] font-mono">{c.exchange}</td>
                    <td className="py-2 text-right font-mono text-zinc-200 text-[13px]">
                      {formatLargeNumber(c.marketCap)}
                    </td>
                    <td className="py-2 text-right font-mono text-zinc-200 text-[13px]">
                      {c.peRatio != null ? `${c.peRatio.toFixed(1)}×` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
