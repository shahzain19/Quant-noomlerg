"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  Star,
  ArrowRight,
} from "lucide-react";
import { Panel, ChangeValue, DataTimestamp, NoData } from "@/components/ui/panel";
import { formatLargeNumber, formatPercent } from "@/lib/calculations";
import type { Quote } from "@/types";
import { SentimentWidget } from "./sentiment-widget";


interface MarketIndex {
  id: number;
  symbol: string;
  name: string;
  quote: Quote | null;
}

interface Mover {
  id: number;
  symbol: string;
  name: string;
  quote: Quote | null;
}

interface NewsItem {
  id: number;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  publishedAt: string;
  relatedSymbol: string | null;
  companyName: string | null;
}

interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  quote: Quote | null;
}

interface DashboardData {
  markets: MarketIndex[];
  movers: Mover[];
  news: NewsItem[];
  watchlist: {
    id: number;
    name: string;
    items: WatchlistItem[];
  } | null;
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-zinc-500 text-sm">Loading dashboard...</div>
    );
  }

  if (!data) {
    return <div className="p-6 text-red-500 text-sm">Failed to load dashboard data.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
      </div>

      {/* Market Sentiment & Telemetry */}
      <SentimentWidget />

      {/* Market Overview */}
      <Panel title="Market Overview">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data.markets.length === 0 && <NoData message="No market data" />}
          {data.markets.map((m) => (
            <Link
              key={m.id}
              href={`/markets/index/${encodeURIComponent(m.symbol)}`}
              className="flex items-center justify-between p-3 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/30 transition-colors rounded"
            >
              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                  {m.symbol}
                </div>
                <div className="font-mono text-zinc-100 text-sm mt-0.5">
                  {m.quote?.price?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) ?? "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {(m.quote?.changePercent ?? 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <ChangeValue value={m.quote?.changePercent ?? null} className="font-mono text-[13px]" />
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mt-0.5">
                  {m.quote?.change != null ? (
                    <span className={m.quote.change >= 0 ? "text-green-500/70" : "text-red-500/70"}>
                      {m.quote.change >= 0 ? "+" : ""}
                      {m.quote.change.toFixed(2)}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-3">
          <DataTimestamp timestamp={data.markets[0]?.quote?.timestamp ?? null} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Movers */}
        <Panel title="Top Movers" className="lg:col-span-2">
          {data.movers.length === 0 && <NoData message="No mover data" />}
          {data.movers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                    <th className="pb-2 font-medium">Symbol</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium text-right">Price</th>
                    <th className="pb-2 font-medium text-right">Change</th>
                    <th className="pb-2 font-medium text-right">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movers.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-2">
                        <Link
                          href={`/companies/${m.symbol}`}
                          className="font-mono text-zinc-100 text-[13px] hover:text-blue-400 transition-colors"
                        >
                          {m.symbol}
                        </Link>
                      </td>
                      <td className="py-2 text-zinc-400 text-[13px] truncate max-w-[160px]">
                        {m.name}
                      </td>
                      <td className="py-2 text-right font-mono text-zinc-200 text-[13px]">
                        {m.quote?.price?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ?? "—"}
                      </td>
                      <td className="py-2 text-right">
                        <ChangeValue value={m.quote?.changePercent ?? null} className="font-mono text-[13px]" />
                      </td>
                      <td className="py-2 text-right font-mono text-zinc-500 text-[12px]">
                        {m.quote?.volume != null
                          ? formatLargeNumber(m.quote.volume, "")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Recent News */}
        <Panel title="Recent News" className="lg:col-span-1">
          {data.news.length === 0 && <NoData message="No recent news" />}
          <div className="space-y-3">
            {data.news.map((n) => (
              <div key={n.id} className="border-b border-zinc-800/50 last:border-0 pb-3 last:pb-0">
                <div className="flex items-start gap-2">
                  <Newspaper className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    {n.url ? (
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-zinc-200 hover:text-blue-400 transition-colors line-clamp-2"
                      >
                        {n.title}
                      </a>
                    ) : (
                      <p className="text-[13px] text-zinc-200 line-clamp-2">{n.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {n.source && (
                        <span className="text-[11px] text-zinc-500">{n.source}</span>
                      )}
                      {n.relatedSymbol && (
                        <span className="text-[11px] font-mono text-zinc-600">
                          {n.relatedSymbol}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-600">
                        {new Date(n.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Watchlist */}
      <Panel
        title={data.watchlist ? `Watchlist — ${data.watchlist.name}` : "Watchlist"}
        action={
          <Link
            href="/watchlist"
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        }
      >
        {!data.watchlist || data.watchlist.items.length === 0 ? (
          <NoData message="No watchlist items" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium text-right">Price</th>
                  <th className="pb-2 font-medium text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.watchlist.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="py-2">
                      <Link
                        href={`/companies/${item.symbol}`}
                        className="font-mono text-zinc-100 text-[13px] hover:text-blue-400 transition-colors"
                      >
                        {item.symbol}
                      </Link>
                    </td>
                    <td className="py-2 text-zinc-400 text-[13px] truncate max-w-[160px]">
                      {item.name}
                    </td>
                    <td className="py-2 text-right font-mono text-zinc-200 text-[13px]">
                      {item.quote?.price?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      <ChangeValue value={item.quote?.changePercent ?? null} className="font-mono text-[13px]" />
                    </td>
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
