"use client";

import { useEffect, useState, useCallback } from "react";
import { FinancialChart } from "@/components/charts";
import { useLayout } from "../layout/layout-context";
import type { PricePoint } from "@/types";

export function MiniChartPanel({ id }: { id: string }) {
  const { panels, updatePanelConfig } = useLayout();
  const panel = panels.find((p) => p.id === id);
  const symbol = (panel?.config?.symbol as string) ?? "AAPL";
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbolInput, setSymbolInput] = useState(symbol);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${encodeURIComponent(symbol)}/prices?range=1M`)
      .then((r) => r.json())
      .then((d: PricePoint[]) => setData(d))
      .catch(() => setData([]))
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
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
        Loading {symbol}...
      </div>
    );
  }

  return (
    <div className="p-1 h-full flex flex-col">
      <form onSubmit={handleSubmit} className="flex items-center gap-1 px-1 mb-0.5">
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          className="px-1.5 py-0 text-[10px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-200 w-14 focus:outline-none focus:border-zinc-500"
          placeholder="AAPL"
        />
      </form>
      <div className="flex-1 min-h-0">
        <FinancialChart
          data={data}
          symbol={symbol}
          range="1M"
          height={200}
          compact
        />
      </div>
    </div>
  );
}
