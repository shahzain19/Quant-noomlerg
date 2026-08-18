"use client";

import { useState } from "react";
import {
  LineChart,
  TrendingUp,
  Newspaper,
  Star,
  BarChart3,
  Building2,
  Plus,
  X,
  DollarSign,
  PieChart,
  Table,
  Activity,
  Waves,
  Coins,
  Globe,
  Bot,
  Grid3x3,
  Layers,
  Target,
  BarChart,
  Calendar,
  FileText,
  Users,
  GitBranch,
} from "lucide-react";
import { useLayout } from "./layout-context";
import { cn } from "@/lib/utils";

const PANEL_TYPES = [
  { type: "chart", label: "Stock Chart", icon: LineChart, desc: "Full interactive chart with overlays", defaultW: 6, defaultH: 4 },
  { type: "mini-chart", label: "Mini Chart", icon: TrendingUp, desc: "Compact sparkline chart", defaultW: 3, defaultH: 3 },
  { type: "movers", label: "Top Movers", icon: TrendingUp, desc: "Biggest gainers & losers", defaultW: 4, defaultH: 4 },
  { type: "news", label: "News Feed", icon: Newspaper, desc: "Latest market news", defaultW: 4, defaultH: 3 },
  { type: "watchlist", label: "Watchlist", icon: Star, desc: "Your tracked securities", defaultW: 4, defaultH: 3 },
  { type: "economic", label: "Economic Data", icon: BarChart3, desc: "GDP, CPI, rates, employment", defaultW: 4, defaultH: 3 },
  { type: "market", label: "Market Overview", icon: Globe, desc: "Major indices snapshot", defaultW: 6, defaultH: 2 },
  { type: "companies", label: "Company List", icon: Building2, desc: "Browse all companies", defaultW: 4, defaultH: 4 },
  { type: "fundamentals", label: "Fundamentals", icon: PieChart, desc: "Revenue, margins, cash flow bars", defaultW: 5, defaultH: 4 },
  { type: "valuation", label: "Valuation", icon: DollarSign, desc: "P/E, P/S, P/B, EV/EBITDA", defaultW: 3, defaultH: 4 },
  { type: "financials", label: "Financials Table", icon: Table, desc: "Income, balance sheet, cash flow", defaultW: 8, defaultH: 4 },
  { type: "rsi", label: "RSI", icon: Activity, desc: "Relative Strength Index (14)", defaultW: 6, defaultH: 2 },
  { type: "macd", label: "MACD", icon: Waves, desc: "MACD (12,26,9) histogram", defaultW: 6, defaultH: 2 },
  { type: "commodities", label: "Commodities", icon: Coins, desc: "Gold, silver, oil prices", defaultW: 4, defaultH: 3 },
  { type: "currencies", label: "Currencies", icon: DollarSign, desc: "FX pairs with sparklines", defaultW: 4, defaultH: 3 },
  { type: "heatmap", label: "Market Heatmap", icon: Grid3x3, desc: "Stocks colored by performance", defaultW: 8, defaultH: 3 },
  { type: "sectors", label: "Sector Breakdown", icon: Layers, desc: "Companies grouped by sector", defaultW: 5, defaultH: 4 },
  { type: "price-levels", label: "Price Levels", icon: Target, desc: "52W high/low, range position", defaultW: 3, defaultH: 4 },
  { type: "volume", label: "Volume Analysis", icon: BarChart, desc: "Volume vs average with spikes", defaultW: 6, defaultH: 2 },
  { type: "earnings", label: "Earnings Calendar", icon: Calendar, desc: "Upcoming earnings & events", defaultW: 5, defaultH: 4 },
  { type: "ai-assistant", label: "AI Assistant", icon: Bot, desc: "Groq-powered market analysis", defaultW: 5, defaultH: 5 },
  { type: "yield-curve", label: "Yield Curve", icon: GitBranch, desc: "US Treasury yield curve", defaultW: 8, defaultH: 3 },
  { type: "macro-calendar", label: "Macro Calendar", icon: Calendar, desc: "FOMC, CPI, jobs reports", defaultW: 5, defaultH: 5 },
  { type: "insider", label: "Insider Trades", icon: Users, desc: "Recent insider transactions", defaultW: 5, defaultH: 4 },
  { type: "filings", label: "SEC Filings", icon: FileText, desc: "Latest 10-K, 10-Q, 8-K", defaultW: 5, defaultH: 4 },
];

export function AddPanelMenu() {
  const [open, setOpen] = useState(false);
  const { addPanel } = useLayout();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded transition-colors border",
          open
            ? "bg-zinc-700 text-zinc-200 border-zinc-600"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
        )}
      >
        {open ? <X size={13} /> : <Plus size={13} />}
        {open ? "Close" : "Add Panel"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-zinc-900 border border-zinc-700 rounded shadow-xl">
            <div className="p-2 border-b border-zinc-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Add Panel
              </span>
            </div>
            <div className="p-1 max-h-[70vh] overflow-auto">
              {PANEL_TYPES.map((pt) => (
                <button
                  key={pt.type}
                  onClick={() => {
                    addPanel(pt.type);
                    setOpen(false);
                  }}
                  className="w-full flex items-start gap-3 px-3 py-2 rounded hover:bg-zinc-800 transition-colors text-left"
                >
                  <pt.icon size={16} className="text-zinc-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13px] text-zinc-200 font-medium">{pt.label}</div>
                    <div className="text-[11px] text-zinc-500">{pt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
