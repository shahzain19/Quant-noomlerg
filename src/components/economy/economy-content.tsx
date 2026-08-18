"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { ExplainButton } from "@/components/explanations/explain-button";
import { cn } from "@/lib/utils";

interface EconomicIndicator {
  name: string;
  category: string;
  unit: string | null;
  source: string | null;
  latest: {
    id: number;
    name: string;
    country: string;
    timestamp: string;
    value: number;
    unit: string | null;
    source: string | null;
    category: string | null;
  };
  history: {
    id: number;
    name: string;
    country: string;
    timestamp: string;
    value: number;
    unit: string | null;
    source: string | null;
    category: string | null;
  }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  inflation: "Inflation",
  employment: "Employment",
  gdp: "GDP",
  rates: "Interest Rates",
  fx: "Foreign Exchange",
  commodities: "Commodities",
};

const CATEGORY_ORDER = ["gdp", "inflation", "employment", "rates", "fx", "commodities"];

function MiniBar({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-px h-4">
      {values.map((v, i) => {
        const height = ((v - min) / range) * 100;
        const isLatest = i === values.length - 1;
        return (
          <div
            key={i}
            className={cn(
              "w-1.5 rounded-sm",
              isLatest ? "bg-blue-500" : "bg-zinc-700"
            )}
            style={{ height: `${Math.max(height, 10)}%` }}
            title={`${v}`}
          />
        );
      })}
    </div>
  );
}

function formatValue(value: number, unit: string | null): string {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "index") return value.toFixed(1);
  if (unit === "USD") return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (unit === "trillions") return `$${value.toFixed(1)}T`;
  if (unit === "millions") return `${value.toFixed(0)}M`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function EconomyContent() {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/economy")
      .then((r) => r.json())
      .then((data: EconomicIndicator[]) => setIndicators(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = indicators.reduce<Record<string, EconomicIndicator[]>>((acc, ind) => {
    const cat = ind.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ind);
    return acc;
  }, {});

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]).concat(
    Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c))
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-100">Economy</h1>
        <div className="ml-auto">
          <ExplainButton context={{ type: "economy", page: "economy" }} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-sm">Loading economic data…</div>
        ) : indicators.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            No economic indicators available.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {sortedCategories.map((cat) => {
              const items = grouped[cat];
              return (
                <Panel
                  key={cat}
                  title={CATEGORY_LABELS[cat] ?? cat}
                  className="border-zinc-800"
                >
                  <div className="space-y-0">
                    {items.map((ind) => {
                      const historyValues = ind.history.map((h) => h.value);
                      const trendValues = historyValues.slice(-6);
                      return (
                        <div
                          key={ind.name}
                          className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-zinc-300 font-medium">{ind.name}</div>
                            {ind.source && (
                              <div className="text-[10px] text-zinc-600">{ind.source}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <MiniBar values={trendValues} />
                            <div className="text-right min-w-[70px]">
                              <div className="text-xs font-mono text-zinc-200">
                                {formatValue(ind.latest.value, ind.unit)}
                              </div>
                              {ind.latest.timestamp && (
                                <div className="text-[10px] text-zinc-600">
                                  {new Date(ind.latest.timestamp).toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
