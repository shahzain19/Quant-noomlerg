"use client";

import { useEffect, useState, useCallback } from "react";
import { FinancialChart } from "@/components/charts";
import { useLayout } from "../layout/layout-context";
import type { PricePoint, ChartRange } from "@/types";

export function ChartPanel({ id }: { id: string }) {
  const { panels, updatePanelConfig } = useLayout();
  const panel = panels.find((p) => p.id === id);
  const symbol = (panel?.config?.symbol as string) ?? "AAPL";
  const range = (panel?.config?.range as ChartRange) ?? "1M";
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbolInput, setSymbolInput] = useState(symbol);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${encodeURIComponent(symbol)}/prices?range=${range}`)
      .then((r) => r.json())
      .then((d: PricePoint[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [symbol, range]);

  const handleRangeChange = useCallback(
    (r: ChartRange) => {
      updatePanelConfig(id, { range: r });
    },
    [id, updatePanelConfig]
  );

  const handleSymbolSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (symbolInput.trim()) {
        updatePanelConfig(id, { symbol: symbolInput.trim().toUpperCase() });
      }
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
    <div className="p-2 h-full flex flex-col">
      <form onSubmit={handleSymbolSubmit} className="flex items-center gap-2 mb-1">
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          className="px-2 py-0.5 text-[12px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-200 w-20 focus:outline-none focus:border-zinc-500"
          placeholder="AAPL"
        />
        <span className="text-[10px] text-zinc-600">Enter symbol</span>
      </form>
      <div className="flex-1 min-h-0">
        <FinancialChart
          data={data}
          symbol={symbol}
          range={range}
          onRangeChange={handleRangeChange}
          height={300}
          compact
        />
      </div>
    </div>
  );
}
