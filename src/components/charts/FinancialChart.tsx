"use client";

import { useState, useCallback } from "react";
import { X, Search } from "lucide-react";
import { ChartProvider, useChart } from "./ChartContext";
import { ChartCanvas } from "./ChartCanvas";
import { ChartToolbar } from "./ChartToolbar";
import { ChartTooltip } from "./ChartTooltip";
import type { PricePoint, ChartRange } from "@/types";
import type { ChartEvent, ComparisonSeries } from "./types";
import { COMPARISON_COLORS } from "./types";
import { cn } from "@/lib/utils";

interface FinancialChartProps {
  data: PricePoint[];
  symbol: string;
  name?: string;
  range?: ChartRange;
  onRangeChange?: (range: ChartRange) => void;
  height?: number;
  compact?: boolean;
  events?: ChartEvent[];
  initialOverlays?: string[];
}

export function FinancialChart({
  data,
  symbol,
  name,
  range = "1M",
  onRangeChange,
  height = 400,
  compact = false,
  events = [],
  initialOverlays = [],
}: FinancialChartProps) {
  const [fullscreen, setFullscreen] = useState(false);

  if (compact) {
    return (
      <ChartProvider data={data} symbol={symbol} range={range} events={events}>
        <div className="w-full" style={{ height }}>
          <ChartCanvas />
        </div>
      </ChartProvider>
    );
  }

  return (
    <ChartProvider data={data} symbol={symbol} range={range} events={events} initialOverlays={initialOverlays}>
      <FinancialChartInner
        symbol={symbol}
        name={name}
        onRangeChange={onRangeChange}
        height={height}
        fullscreen={fullscreen}
        setFullscreen={setFullscreen}
      />
    </ChartProvider>
  );
}

function FinancialChartInner({
  symbol,
  name,
  onRangeChange,
  height,
  fullscreen,
  setFullscreen,
}: {
  symbol: string;
  name?: string;
  onRangeChange?: (range: ChartRange) => void;
  height: number;
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
}) {
  const chart = useChart();
  const [compareOpen, setCompareOpen] = useState(false);

  const handleRangeChange = useCallback(
    (r: any) => {
      chart.setRange(r);
      onRangeChange?.(r);
    },
    [chart, onRangeChange]
  );

  const addComparison = useCallback(
    async (cmpSymbol: string) => {
      try {
        const res = await fetch(
          `/api/companies/${encodeURIComponent(cmpSymbol)}/prices?range=${chart.range}`
        );
        const cmpData: PricePoint[] = await res.json();
        if (cmpData.length === 0) return;
        const colorIdx = chart.comparisonSeries.length;
        chart.addComparison({
          symbol: cmpSymbol.toUpperCase(),
          name: cmpSymbol.toUpperCase(),
          data: cmpData,
          color: COMPARISON_COLORS[colorIdx % COMPARISON_COLORS.length],
        });
        setCompareOpen(false);
      } catch {
        // silently fail
      }
    },
    [chart]
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        fullscreen && "fixed inset-0 z-50 bg-black p-4"
      )}
      style={fullscreen ? {} : {}}
    >
      <div className="flex items-center gap-3 mb-2">
        <div>
          <span className="text-sm font-semibold text-zinc-100">{symbol}</span>
          {name && <span className="text-[11px] text-zinc-500 ml-2">{name}</span>}
        </div>
        {chart.comparisonSeries.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            {chart.comparisonSeries.map((s, i) => (
              <span
                key={s.symbol}
                className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-700"
                style={{ color: COMPARISON_COLORS[i % COMPARISON_COLORS.length] }}
              >
                {s.symbol}
                <button
                  onClick={() => chart.removeComparison(s.symbol)}
                  className="hover:text-white transition-colors"
                >
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border border-zinc-800 bg-zinc-950 rounded overflow-hidden">
        <div className="px-2 py-1.5 border-b border-zinc-800 bg-zinc-900/50">
          <ChartToolbar onCompareClick={() => setCompareOpen(!compareOpen)} />
        </div>

        <div className="relative" style={{ height: fullscreen ? "calc(100vh - 120px)" : height }}>
          <ChartCanvas />
          <ChartTooltip />
        </div>
      </div>

      {compareOpen && (
        <CompareDropdown
          onAdd={addComparison}
          onClose={() => setCompareOpen(false)}
          existing={chart.comparisonSeries.map((s) => s.symbol)}
        />
      )}
    </div>
  );
}

function CompareDropdown({
  onAdd,
  onClose,
  existing,
}: {
  onAdd: (symbol: string) => void;
  onClose: () => void;
  existing: string[];
}) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setInput(q);
    if (q.length < 1) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setResults(
        (data.results ?? data ?? [])
          .filter((r: any) => !existing.includes(r.symbol))
          .slice(0, 5)
      );
    } catch {
      setResults([]);
    }
    setSearching(false);
  };

  return (
    <div className="mt-2 bg-zinc-900 border border-zinc-700 rounded p-2 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <Search size={12} className="text-zinc-500" />
        <input
          type="text"
          value={input}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search symbol to compare..."
          className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          autoFocus
        />
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <X size={12} />
        </button>
      </div>
      {results.length > 0 && (
        <div className="space-y-0.5">
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => onAdd(r.symbol)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
            >
              <span className="font-mono font-semibold">{r.symbol}</span>
              <span className="text-zinc-500">{r.name}</span>
            </button>
          ))}
        </div>
      )}
      {searching && (
        <div className="text-[10px] text-zinc-500 text-center py-1">Searching...</div>
      )}
    </div>
  );
}
