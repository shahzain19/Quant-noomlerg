"use client";

import { useEffect, useState, useCallback } from "react";
import { useLayout } from "../layout/layout-context";
import type { CompanyDetail } from "@/types";

export function PriceLevelsPanel({ id }: { id: string }) {
  const { panels, updatePanelConfig } = useLayout();
  const panel = panels.find((p) => p.id === id);
  const symbol = (panel?.config?.symbol as string) ?? "AAPL";
  const [data, setData] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [symbolInput, setSymbolInput] = useState(symbol);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d: CompanyDetail) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [symbol]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (symbolInput.trim()) updatePanelConfig(id, { symbol: symbolInput.trim().toUpperCase() });
    },
    [id, symbolInput, updatePanelConfig]
  );

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading {symbol}...</div>;
  if (!data) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No data</div>;

  const price = data.quote?.price;
  const high52 = data.high52w;
  const low52 = data.low52w;

  const levels = [
    { label: "Current Price", value: price, color: "text-zinc-100", bold: true },
    { label: "52-Week High", value: high52, color: "text-green-400" },
    { label: "52-Week Low", value: low52, color: "text-red-400" },
  ];

  if (price != null && high52 != null) {
    const distFromHigh = ((price - high52) / high52) * 100;
    levels.push({ label: "Dist from 52W High", value: null, color: distFromHigh >= 0 ? "text-green-400" : "text-amber-400", display: `${distFromHigh.toFixed(1)}%` } as any);
  }

  if (price != null && low52 != null) {
    const distFromLow = ((price - low52) / low52) * 100;
    levels.push({ label: "Dist from 52W Low", value: null, color: "text-green-400", display: `+${distFromLow.toFixed(1)}%` } as any);
  }

  if (price != null && high52 != null && low52 != null) {
    const range52 = high52 - low52;
    const pctInRange = ((price - low52) / range52) * 100;
    levels.push({ label: "Position in 52W Range", value: null, color: "text-blue-400", display: `${pctInRange.toFixed(0)}%`, isBar: true, barPct: pctInRange } as any);
  }

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-2 pt-2 pb-1">
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          className="px-2 py-0.5 text-[11px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-200 w-16 focus:outline-none focus:border-zinc-500"
          placeholder="AAPL"
        />
        <span className="text-[10px] text-zinc-600">{data.name}</span>
      </form>
      <div className="flex-1 overflow-auto px-2 pb-2 space-y-0">
        {levels.map((l: any) => (
          <div key={l.label} className="py-2 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">{l.label}</span>
              <span className={`font-mono text-[11px] ${l.color} ${l.bold ? "font-bold" : ""}`}>
                {l.display ?? (l.value != null ? `$${l.value.toFixed(2)}` : "—")}
              </span>
            </div>
            {l.isBar && (
              <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(Math.max(l.barPct, 0), 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
