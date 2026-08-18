"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Play } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { ExplainButton } from "@/components/explanations/explain-button";
import { formatLargeNumber, formatPercent, formatNumber } from "@/lib/calculations";
import type { ScreenerResult } from "@/types";

interface ScreenerFacets {
  sectors: string[];
  exchanges: string[];
}

type SortKey = "symbol" | "name" | "sector" | "price" | "marketCap" | "peRatio" | "revenueGrowth" | "netMargin" | "dividendYield";

const COLUMNS: { key: SortKey; label: string; align?: string }[] = [
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Name" },
  { key: "sector", label: "Sector" },
  { key: "price", label: "Price", align: "right" },
  { key: "marketCap", label: "Mkt Cap", align: "right" },
  { key: "peRatio", label: "P/E", align: "right" },
  { key: "revenueGrowth", label: "Rev Growth", align: "right" },
  { key: "netMargin", label: "Net Margin", align: "right" },
  { key: "dividendYield", label: "Div Yield", align: "right" },
];

function cellValue(key: SortKey, r: ScreenerResult) {
  switch (key) {
    case "symbol":
      return r.symbol;
    case "name":
      return r.name;
    case "sector":
      return r.sector ?? "—";
    case "price":
      return r.price != null ? `$${r.price.toFixed(2)}` : "—";
    case "marketCap":
      return formatLargeNumber(r.marketCap);
    case "peRatio":
      return formatNumber(r.peRatio);
    case "revenueGrowth":
      return formatPercent(r.revenueGrowth);
    case "netMargin":
      return formatPercent(r.netMargin);
    case "dividendYield":
      return formatPercent(r.dividendYield);
    default:
      return "—";
  }
}

function PresetButton({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-[11px] font-mono border rounded transition-colors ${
        active
          ? "border-zinc-600 bg-zinc-800 text-zinc-200"
          : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

export function ScreenerContent() {
  const [facets, setFacets] = useState<ScreenerFacets>({ sectors: [], exchanges: [] });
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const [sortBy, setSortBy] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [minMarketCap, setMinMarketCap] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minRevenueGrowth, setMinRevenueGrowth] = useState("");
  const [minProfitMargin, setMinProfitMargin] = useState("");
  const [maxDebt, setMaxDebt] = useState("");
  const [minDividendYield, setMinDividendYield] = useState("");
  const [sector, setSector] = useState("");
  const [exchange, setExchange] = useState("");

  useEffect(() => {
    fetch("/api/screener?limit=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.facets) setFacets(d.facets);
      })
      .catch(() => {});
  }, []);

  const runScreener = useCallback(() => {
    setLoading(true);
    setRan(true);
    const params = new URLSearchParams();
    if (minMarketCap) params.set("minMarketCap", minMarketCap);
    if (maxPe) params.set("maxPe", maxPe);
    if (minRevenueGrowth) params.set("minRevenueGrowth", minRevenueGrowth);
    if (minProfitMargin) params.set("minProfitMargin", minProfitMargin);
    if (maxDebt) params.set("maxDebt", maxDebt);
    if (minDividendYield) params.set("minDividendYield", minDividendYield);
    if (sector) params.set("sector", sector);
    if (exchange) params.set("exchange", exchange);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("limit", "100");

    fetch(`/api/screener?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results ?? []);
        setTotal(d.total ?? 0);
        if (d.facets) setFacets(d.facets);
      })
      .catch(() => {
        setResults([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [minMarketCap, maxPe, minRevenueGrowth, minProfitMargin, maxDebt, minDividendYield, sector, exchange, sortBy, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortBy) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  function handlePresetMarketCap(value: string) {
    setMinMarketCap((prev) => (prev === value ? "" : value));
  }

  function handlePresetDebt(value: string) {
    setMaxDebt((prev) => (prev === value ? "" : value));
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-100">Stock Screener</h1>
        <div className="ml-auto">
          <ExplainButton
            context={{
              type: "screener",
              filters: { minMarketCap, maxPe, minRevenueGrowth, minProfitMargin, maxDebt, minDividendYield, sector, exchange },
              resultCount: total,
            }}
          />
        </div>
      </div>

      <Panel title="Filters">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Min Market Cap</label>
            <input
              type="number"
              value={minMarketCap}
              onChange={(e) => setMinMarketCap(e.target.value)}
              placeholder="e.g. 10000000000"
              className="w-full px-2 py-1.5 text-[13px] font-mono bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <div className="flex gap-1.5">
              <PresetButton label="$10B" onClick={() => handlePresetMarketCap("10000000000")} active={minMarketCap === "10000000000"} />
              <PresetButton label="$100B" onClick={() => handlePresetMarketCap("100000000000")} active={minMarketCap === "100000000000"} />
              <PresetButton label="$1T" onClick={() => handlePresetMarketCap("1000000000000")} active={minMarketCap === "1000000000000"} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Max P/E</label>
            <input
              type="number"
              value={maxPe}
              onChange={(e) => setMaxPe(e.target.value)}
              placeholder="e.g. 30"
              className="w-full px-2 py-1.5 text-[13px] font-mono bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Min Rev Growth %</label>
            <input
              type="number"
              value={minRevenueGrowth}
              onChange={(e) => setMinRevenueGrowth(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-2 py-1.5 text-[13px] font-mono bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Min Profit Margin %</label>
            <input
              type="number"
              value={minProfitMargin}
              onChange={(e) => setMinProfitMargin(e.target.value)}
              placeholder="e.g. 15"
              className="w-full px-2 py-1.5 text-[13px] font-mono bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Max Debt</label>
            <input
              type="number"
              value={maxDebt}
              onChange={(e) => setMaxDebt(e.target.value)}
              placeholder="e.g. 50000000000"
              className="w-full px-2 py-1.5 text-[13px] font-mono bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <div className="flex gap-1.5">
              <PresetButton label="$10B" onClick={() => handlePresetDebt("10000000000")} active={maxDebt === "10000000000"} />
              <PresetButton label="$50B" onClick={() => handlePresetDebt("50000000000")} active={maxDebt === "50000000000"} />
              <PresetButton label="$100B" onClick={() => handlePresetDebt("100000000000")} active={maxDebt === "100000000000"} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Min Div Yield %</label>
            <input
              type="number"
              value={minDividendYield}
              onChange={(e) => setMinDividendYield(e.target.value)}
              placeholder="e.g. 2"
              className="w-full px-2 py-1.5 text-[13px] font-mono bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-2 py-1.5 text-[13px] font-mono bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="">All Sectors</option>
              {facets.sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Exchange</label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="w-full px-2 py-1.5 text-[13px] font-mono bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="">All Exchanges</option>
              {facets.exchanges.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={runScreener}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded transition-colors disabled:opacity-50"
          >
            <Play size={14} />
            {loading ? "Running..." : "Run Screener"}
          </button>
        </div>
      </Panel>

      <Panel
        title="Results"
        action={
          ran && !loading ? (
            <span className="text-[11px] font-mono text-zinc-500">
              {total} match{total !== 1 ? "es" : ""}
            </span>
          ) : undefined
        }
      >
        {!ran ? (
          <div className="py-8 text-center text-zinc-500 text-sm">
            Set your filters and click Run Screener to find stocks.
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-zinc-500 text-sm">Scanning stocks...</div>
        ) : results.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-sm">No stocks match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`pb-2 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortBy === col.key && (
                          sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.symbol}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
                  >
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={`py-2 text-[13px] ${
                          col.align === "right" ? "text-right font-mono" : ""
                        } ${col.key === "symbol" ? "font-mono" : ""}`}
                      >
                        {col.key === "symbol" ? (
                          <Link
                            href={`/companies/${r.symbol}`}
                            className="text-zinc-100 hover:text-blue-400 transition-colors"
                          >
                            {r.symbol}
                          </Link>
                        ) : col.key === "name" ? (
                          <span className="text-zinc-400 truncate max-w-[160px] inline-block">
                            {r.name}
                          </span>
                        ) : col.key === "sector" ? (
                          <span className="text-zinc-400">{r.sector ?? "—"}</span>
                        ) : col.key === "revenueGrowth" || col.key === "netMargin" || col.key === "dividendYield" ? (
                          <span
                            className={
                              (col.key === "revenueGrowth" ? r.revenueGrowth : col.key === "netMargin" ? r.netMargin : r.dividendYield) != null &&
                              (col.key === "revenueGrowth" ? r.revenueGrowth! : col.key === "netMargin" ? r.netMargin! : r.dividendYield!) >= 0
                                ? "text-green-500"
                                : (col.key === "revenueGrowth" ? r.revenueGrowth : col.key === "netMargin" ? r.netMargin : r.dividendYield) != null
                                ? "text-red-500"
                                : "text-zinc-500"
                            }
                          >
                            {cellValue(col.key, r)}
                          </span>
                        ) : (
                          <span className="text-zinc-200">{cellValue(col.key, r)}</span>
                        )}
                      </td>
                    ))}
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
