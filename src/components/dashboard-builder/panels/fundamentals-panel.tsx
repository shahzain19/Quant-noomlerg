"use client";

import { useEffect, useState, useCallback } from "react";
import { useLayout } from "../layout/layout-context";
import type { FinancialStatement } from "@/types";

function formatVal(v: number | null): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function formatPct(v: number | null): string {
  if (v == null) return "—";
  return `${v.toFixed(1)}%`;
}

export function FundamentalsPanel({ id }: { id: string }) {
  const { panels, updatePanelConfig } = useLayout();
  const panel = panels.find((p) => p.id === id);
  const symbol = (panel?.config?.symbol as string) ?? "AAPL";
  const [data, setData] = useState<FinancialStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbolInput, setSymbolInput] = useState(symbol);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${encodeURIComponent(symbol)}/financials?periodType=annual`)
      .then((r) => r.json())
      .then((d: FinancialStatement[]) => setData(d))
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
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading {symbol}...</div>;
  }

  if (!data.length) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No financial data</div>;
  }

  const latest = data[0];
  const prev = data[1];

  const revenueGrowth = latest.revenue && prev?.revenue ? ((latest.revenue - prev.revenue) / prev.revenue) * 100 : null;
  const grossMargin = latest.revenue ? (latest.grossProfit ?? 0) / latest.revenue * 100 : null;
  const opMargin = latest.revenue ? (latest.operatingIncome ?? 0) / latest.revenue * 100 : null;
  const netMargin = latest.revenue ? (latest.netIncome ?? 0) / latest.revenue * 100 : null;

  const metrics = [
    { label: "Revenue", value: formatVal(latest.revenue), growth: revenueGrowth, bar: latest.revenue, maxBar: data.reduce((m, d) => Math.max(m, d.revenue ?? 0), 0) },
    { label: "Gross Profit", value: formatVal(latest.grossProfit), pct: grossMargin, bar: latest.grossProfit, maxBar: data.reduce((m, d) => Math.max(m, d.grossProfit ?? 0), 0) },
    { label: "Operating Income", value: formatVal(latest.operatingIncome), pct: opMargin, bar: latest.operatingIncome, maxBar: data.reduce((m, d) => Math.max(m, d.operatingIncome ?? 0), 0) },
    { label: "Net Income", value: formatVal(latest.netIncome), pct: netMargin, bar: latest.netIncome, maxBar: data.reduce((m, d) => Math.max(m, d.netIncome ?? 0), 0) },
    { label: "EPS", value: latest.eps != null ? `$${latest.eps.toFixed(2)}` : "—" },
    { label: "Free Cash Flow", value: formatVal(latest.freeCashFlow) },
    { label: "Cash", value: formatVal(latest.cash) },
    { label: "Debt", value: formatVal(latest.debt) },
    { label: "Assets", value: formatVal(latest.assets) },
    { label: "Equity", value: formatVal(latest.equity) },
  ];

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
        <span className="text-[10px] text-zinc-600">{latest.period}</span>
      </form>
      <div className="flex-1 overflow-auto px-2 pb-2">
        <div className="space-y-1.5">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2 text-[11px]">
              <span className="text-zinc-500 w-28 shrink-0">{m.label}</span>
              <div className="flex-1 h-3 bg-zinc-900 rounded overflow-hidden">
                {m.bar != null && m.maxBar > 0 && (
                  <div
                    className="h-full bg-blue-500/30 rounded"
                    style={{ width: `${Math.max((m.bar / m.maxBar) * 100, 2)}%` }}
                  />
                )}
              </div>
              <span className="font-mono text-zinc-200 w-20 text-right shrink-0">{m.value}</span>
              {m.growth != null && (
                <span className={`font-mono w-14 text-right shrink-0 ${m.growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {m.growth >= 0 ? "+" : ""}{m.growth.toFixed(1)}%
                </span>
              )}
              {m.pct != null && (
                <span className="font-mono text-zinc-400 w-14 text-right shrink-0">{m.pct.toFixed(1)}%</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
