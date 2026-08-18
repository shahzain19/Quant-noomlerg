"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatLargeNumber, formatPercent, formatNumber } from "@/lib/calculations";
import { Panel, ChangeValue, NoData, DataTimestamp } from "@/components/ui/panel";
import { FinancialChart } from "@/components/charts";
import { MetricExplanation } from "@/components/explanations/metric-explanation";
import { ExplainButton } from "@/components/explanations/explain-button";
import { useExplorerMode } from "@/components/providers/app-provider";
import type {
  CompanyDetail as CompanyDetailType,
  PricePoint,
  FinancialStatement,
  ChartRange,
  PeriodType,
} from "@/types";

type Tab = "overview" | "chart" | "financials" | "valuation" | "news" | "events";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "chart", label: "Chart" },
  { key: "financials", label: "Financials" },
  { key: "valuation", label: "Valuation" },
  { key: "news", label: "News" },
  { key: "events", label: "Events" },
];

export function CompanyDetail({ symbol }: { symbol: string }) {
  const explorer = useExplorerMode();
  const [company, setCompany] = useState<(CompanyDetailType & { news: any[]; events: any[] }) | null>(null);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [financials, setFinancials] = useState<FinancialStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [chartRange, setChartRange] = useState<ChartRange>("1M");
  const [periodType, setPeriodType] = useState<PeriodType>("annual");
  const [watchlistStatus, setWatchlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/companies/${symbol}`).then((r) => r.json()),
      fetch(`/api/companies/${symbol}/prices?range=1M`).then((r) => r.json()),
      fetch(`/api/companies/${symbol}/financials?periodType=annual`).then((r) => r.json()),
    ])
      .then(([companyData, priceData, finData]) => {
        setCompany(companyData);
        setPrices(priceData);
        setFinancials(finData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol]);

  const fetchChartPrices = useCallback(
    async (range: ChartRange) => {
      setChartRange(range);
      try {
        const res = await fetch(`/api/companies/${symbol}/prices?range=${range}`);
        const data = await res.json();
        setPrices(data);
      } catch {}
    },
    [symbol]
  );

  const fetchFinancials = useCallback(
    async (pt: PeriodType) => {
      setPeriodType(pt);
      try {
        const res = await fetch(`/api/companies/${symbol}/financials?periodType=${pt}`);
        const data = await res.json();
        setFinancials(data);
      } catch {}
    },
    [symbol]
  );

  async function handleAddToWatchlist() {
    setWatchlistStatus("loading");
    try {
      const wlRes = await fetch("/api/watchlists");
      const watchlists = await wlRes.json();
      const wl = watchlists[0];
      if (!wl) {
        setWatchlistStatus("error");
        return;
      }
      await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", watchlistId: wl.id, symbol }),
      });
      setWatchlistStatus("success");
    } catch {
      setWatchlistStatus("error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 text-sm">
        Loading {symbol}...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-zinc-400">Company not found: {symbol}</p>
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
          ← Back to terminal
        </Link>
      </div>
    );
  }

  const q = company.quote;
  const change = q?.change ?? null;
  const changePct = q?.changePercent ?? null;
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1200px] mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 mb-2"
            >
              <ArrowLeft size={12} />
              Terminal
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-zinc-100">{company.name}</h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-mono text-zinc-400">{company.ticker}</span>
              <span>·</span>
              <span>{company.sector ?? "—"}</span>
              <span>·</span>
              <span>{company.exchange}</span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="font-mono text-2xl text-zinc-100">
              {q?.price != null ? `$${q.price.toFixed(2)}` : "—"}
            </div>
            {change != null && changePct != null && (
              <div className="flex items-center justify-end gap-2 font-mono text-sm">
                <span className={isPositive ? "text-green-500" : "text-red-500"}>
                  {isPositive ? "+" : ""}
                  {change.toFixed(2)}
                </span>
                <ChangeValue value={changePct} />
                {isPositive ? (
                  <TrendingUp size={14} className="text-green-500" />
                ) : (
                  <TrendingDown size={14} className="text-red-500" />
                )}
              </div>
            )}
            <button
              onClick={handleAddToWatchlist}
              disabled={watchlistStatus === "loading"}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors mt-2"
            >
              <Star size={12} />
              {watchlistStatus === "success"
                ? "Added!"
                : watchlistStatus === "loading"
                  ? "Adding..."
                  : "Add to Watchlist"}
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 rounded">
          {[
            { key: "marketCap", label: "Market Cap", value: formatLargeNumber(company.marketCap) },
            { key: "peRatio", label: "P/E", value: formatNumber(company.peRatio) },
            { key: "eps", label: "EPS", value: company.eps != null ? `$${formatNumber(company.eps)}` : "—" },
            { key: "revenue", label: "Revenue", value: formatLargeNumber(company.revenue) },
            { key: "netMargin", label: "Net Margin", value: formatPercent(company.netMargin) },
            { key: "dividendYield", label: "Div Yield", value: formatPercent(company.dividendYield) },
            {
              key: "high52w",
              label: "52W High",
              value: company.high52w != null ? `$${company.high52w.toFixed(2)}` : "—",
            },
            { key: "beta", label: "Beta", value: formatNumber(company.beta) },
          ].map((m) => (
            <div key={m.key} className="bg-zinc-950 p-3">
              {explorer ? (
                <MetricExplanation metricKey={m.key} value={m.value} />
              ) : (
                <div className="space-y-0.5">
                  <div className="text-[11px] text-zinc-500">{m.label}</div>
                  <div className="font-mono text-sm text-zinc-100">{m.value}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-800 flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm transition-colors ${
                tab === t.key
                  ? "border-b-2 border-zinc-100 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {tab === "overview" && (
            <div className="space-y-4">
              {company.description && (
                <Panel title="About">
                  <p className="text-sm text-zinc-400 leading-relaxed">{company.description}</p>
                </Panel>
              )}
              <Panel title="Key Metrics">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[11px] text-zinc-500">Sector</div>
                    <div className="text-sm text-zinc-200">{company.sector ?? "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-zinc-500">Industry</div>
                    <div className="text-sm text-zinc-200">{company.industry ?? "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-zinc-500">Country</div>
                    <div className="text-sm text-zinc-200">{company.country ?? "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-zinc-500">Exchange</div>
                    <div className="text-sm text-zinc-200">{company.exchange}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-zinc-500">52W Low</div>
                    <div className="font-mono text-sm text-zinc-200">
                      {company.low52w != null ? `$${company.low52w.toFixed(2)}` : "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] text-zinc-500">Revenue Growth</div>
                    <div className="font-mono text-sm text-zinc-200">
                      {formatPercent(company.revenueGrowth)}
                    </div>
                  </div>
                </div>
              </Panel>
              <ExplainButton
                context={{ symbol, company, metrics: "overview" }}
              />
              <DataTimestamp timestamp={company.dataTimestamp} />
            </div>
          )}

          {tab === "chart" && (
            <div className="space-y-4">
              <div className="px-3">
                <FinancialChart
                  data={prices}
                  symbol={symbol}
                  name={company.name}
                  range={chartRange}
                  onRangeChange={fetchChartPrices}
                  height={400}
                  events={(company.events ?? []).map((e: any) => ({
                    date: e.date,
                    type: e.type as any,
                    label: e.title,
                    description: e.description,
                  }))}
                />
              </div>
            </div>
          )}

          {tab === "financials" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchFinancials("annual")}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    periodType === "annual"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Annual
                </button>
                <button
                  onClick={() => fetchFinancials("quarterly")}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    periodType === "quarterly"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Quarterly
                </button>
              </div>

              {financials.length === 0 ? (
                <NoData message="No financial data available" />
              ) : (
                <div className="space-y-6">
                  <FinancialTable
                    title="Income Statement"
                    rows={[
                      { label: "Revenue", key: "revenue" },
                      { label: "Cost of Revenue", key: "costOfRevenue" },
                      { label: "Gross Profit", key: "grossProfit" },
                      { label: "Operating Income", key: "operatingIncome" },
                      { label: "Net Income", key: "netIncome" },
                      { label: "EPS", key: "eps" },
                    ]}
                    data={financials}
                  />
                  <FinancialTable
                    title="Balance Sheet"
                    rows={[
                      { label: "Total Assets", key: "assets" },
                      { label: "Total Liabilities", key: "liabilities" },
                      { label: "Equity", key: "equity" },
                      { label: "Cash", key: "cash" },
                      { label: "Debt", key: "debt" },
                    ]}
                    data={financials}
                  />
                  <FinancialTable
                    title="Cash Flow"
                    rows={[
                      { label: "Operating Cash Flow", key: "operatingCashFlow" },
                      { label: "CapEx", key: "capex" },
                      { label: "Free Cash Flow", key: "freeCashFlow" },
                    ]}
                    data={financials}
                  />
                </div>
              )}
            </div>
          )}

          {tab === "valuation" && (
            <div className="space-y-1">
              {[
                { key: "peRatio", label: "P/E Ratio", value: formatNumber(company.peRatio) },
                { key: "priceToSales", label: "P/S Ratio", value: formatNumber(company.priceToSales) },
                { key: "priceToBook", label: "P/B Ratio", value: formatNumber(company.priceToBook) },
                { key: "evToEbitda", label: "EV/EBITDA", value: formatNumber(company.evToEbitda) },
                { key: "dividendYield", label: "Dividend Yield", value: formatPercent(company.dividendYield) },
              ].map((m) => (
                <MetricExplanation key={m.key} metricKey={m.key} value={m.value} />
              ))}
            </div>
          )}

          {tab === "news" && (
            <div className="space-y-0">
              {(!company.news || company.news.length === 0) ? (
                <NoData message="No recent news" />
              ) : (
                company.news.map((item: any) => (
                  <div
                    key={item.id}
                    className="border-b border-zinc-800/50 py-3 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-sm text-zinc-200 leading-snug">{item.title}</h4>
                        {item.summary && (
                          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.source && (
                          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                            {item.source}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "events" && (
            <div className="space-y-0">
              {(!company.events || company.events.length === 0) ? (
                <NoData message="No upcoming events" />
              ) : (
                company.events.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="border-b border-zinc-800/50 py-3 last:border-0 flex items-start gap-3"
                  >
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-zinc-800 text-zinc-400 rounded shrink-0 mt-0.5">
                      {ev.type}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm text-zinc-200 leading-snug">{ev.title}</h4>
                      {ev.description && (
                        <p className="text-xs text-zinc-500 leading-relaxed">{ev.description}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono shrink-0 mt-0.5">
                      {ev.date
                        ? new Date(ev.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FinancialTable({
  title,
  rows,
  data,
}: {
  title: string;
  rows: { label: string; key: keyof FinancialStatement }[];
  data: FinancialStatement[];
}) {
  const periods = data.map((d) => d.period);
  return (
    <Panel title={title}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-1.5 pr-3 text-zinc-500 font-medium sticky left-0 bg-zinc-950/50">
                {title}
              </th>
              {periods.map((p) => (
                <th
                  key={p}
                  className="text-right py-1.5 px-3 text-zinc-500 font-medium font-mono"
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.key}
                className={`border-b border-zinc-800/30 ${i % 2 === 0 ? "bg-zinc-900/20" : ""}`}
              >
                <td className="py-1.5 pr-3 text-zinc-400 sticky left-0 bg-zinc-950/50">
                  {row.label}
                </td>
                {data.map((d, j) => (
                  <td key={j} className="text-right py-1.5 px-3 font-mono text-zinc-200">
                    {d[row.key] != null ? formatLargeNumber(d[row.key] as number) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
