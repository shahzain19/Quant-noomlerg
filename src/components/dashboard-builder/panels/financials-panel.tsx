"use client";

import { useEffect, useState, useCallback } from "react";
import { useLayout } from "../layout/layout-context";
import type { FinancialStatement, PeriodType } from "@/types";

function fmt(v: number | null): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(2);
}

type StatementSection = {
  title: string;
  rows: { label: string; key: keyof FinancialStatement }[];
};

const SECTIONS: StatementSection[] = [
  {
    title: "Income Statement",
    rows: [
      { label: "Revenue", key: "revenue" },
      { label: "Gross Profit", key: "grossProfit" },
      { label: "Operating Income", key: "operatingIncome" },
      { label: "Net Income", key: "netIncome" },
      { label: "EPS", key: "eps" },
    ],
  },
  {
    title: "Balance Sheet",
    rows: [
      { label: "Assets", key: "assets" },
      { label: "Liabilities", key: "liabilities" },
      { label: "Equity", key: "equity" },
      { label: "Cash", key: "cash" },
      { label: "Debt", key: "debt" },
    ],
  },
  {
    title: "Cash Flow",
    rows: [
      { label: "Operating CF", key: "operatingCashFlow" },
      { label: "CapEx", key: "capex" },
      { label: "Free Cash Flow", key: "freeCashFlow" },
    ],
  },
];

export function FinancialsPanel({ id }: { id: string }) {
  const { panels, updatePanelConfig } = useLayout();
  const panel = panels.find((p) => p.id === id);
  const symbol = (panel?.config?.symbol as string) ?? "AAPL";
  const periodType = ((panel?.config?.periodType as string) ?? "annual") as PeriodType;
  const [data, setData] = useState<FinancialStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbolInput, setSymbolInput] = useState(symbol);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${encodeURIComponent(symbol)}/financials?periodType=${periodType}`)
      .then((r) => r.json())
      .then((d: FinancialStatement[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [symbol, periodType]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (symbolInput.trim()) updatePanelConfig(id, { symbol: symbolInput.trim().toUpperCase() });
    },
    [id, symbolInput, updatePanelConfig]
  );

  const togglePeriod = useCallback(() => {
    updatePanelConfig(id, { periodType: periodType === "annual" ? "quarterly" : "annual" });
  }, [id, periodType, updatePanelConfig]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading {symbol}...</div>;
  }

  if (!data.length) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No financial data</div>;
  }

  const periods = data.slice(0, 4);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 pt-2 pb-1">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            className="px-2 py-0.5 text-[11px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-200 w-16 focus:outline-none focus:border-zinc-500"
            placeholder="AAPL"
          />
        </form>
        <button
          onClick={togglePeriod}
          className="px-2 py-0.5 text-[10px] font-medium rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {periodType === "annual" ? "Annual" : "Quarterly"}
        </button>
      </div>
      <div className="flex-1 overflow-auto px-2 pb-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{section.title}</div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-1 pr-2 text-zinc-600 font-medium">{section.title}</th>
                  {periods.map((p) => (
                    <th key={p.period} className="text-right py-1 px-2 text-zinc-600 font-mono font-medium">{p.period}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr key={row.key} className="border-b border-zinc-800/30">
                    <td className="py-1 pr-2 text-zinc-500">{row.label}</td>
                    {periods.map((p) => (
                      <td key={p.period} className="text-right py-1 px-2 font-mono text-zinc-300">
                        {fmt(p[row.key] as number | null)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
