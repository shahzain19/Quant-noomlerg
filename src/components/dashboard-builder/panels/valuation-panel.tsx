"use client";

import { useEffect, useState, useCallback } from "react";
import { useLayout } from "../layout/layout-context";
import type { CompanyDetail } from "@/types";

function fmt(v: number | null): string {
  if (v == null) return "—";
  return v.toFixed(2);
}

export function ValuationPanel({ id }: { id: string }) {
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

  if (loading) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading {symbol}...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No data for {symbol}</div>;
  }

  const metrics = [
    { label: "P/E Ratio", value: fmt(data.peRatio), color: data.peRatio != null && data.peRatio > 30 ? "text-amber-400" : "text-zinc-200" },
    { label: "P/S Ratio", value: fmt(data.priceToSales) },
    { label: "P/B Ratio", value: fmt(data.priceToBook) },
    { label: "EV/EBITDA", value: fmt(data.evToEbitda) },
    { label: "EPS", value: data.eps != null ? `$${data.eps.toFixed(2)}` : "—" },
    { label: "Dividend Yield", value: data.dividendYield != null ? `${data.dividendYield.toFixed(2)}%` : "—" },
    { label: "Beta", value: fmt(data.beta) },
    { label: "52W High", value: data.high52w != null ? `$${data.high52w.toFixed(2)}` : "—" },
    { label: "52W Low", value: data.low52w != null ? `$${data.low52w.toFixed(2)}` : "—" },
  ];

  const price = data.quote?.price;
  const high52 = data.high52w;
  const low52 = data.low52w;
  const range52 = high52 != null && low52 != null && price != null ? ((price - low52) / (high52 - low52)) * 100 : null;

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
      <div className="flex-1 overflow-auto px-2 pb-2">
        {range52 != null && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
              <span>52W Range</span>
              <span className="font-mono">{range52.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(Math.max(range52, 0), 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-0.5">
              <span>{low52 != null ? `$${low52.toFixed(2)}` : "—"}</span>
              <span>{high52 != null ? `$${high52.toFixed(2)}` : "—"}</span>
            </div>
          </div>
        )}
        <div className="space-y-0">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50">
              <span className="text-[11px] text-zinc-500">{m.label}</span>
              <span className={`font-mono text-[11px] ${m.color ?? "text-zinc-200"}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
