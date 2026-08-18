"use client";

import { useState } from "react";
import {
  LineChart,
  TrendingUp,
  Newspaper,
  Star,
  BarChart3,
  Building2,
  RotateCcw,
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
import { LayoutProvider, useLayout } from "./layout/layout-context";
import { PanelWrapper } from "./layout/panel-wrapper";
import { AddPanelMenu } from "./layout/add-panel-menu";
import { ChartPanel } from "./panels/chart-panel";
import { MiniChartPanel } from "./panels/mini-chart-panel";
import { MoversPanel } from "./panels/movers-panel";
import { NewsPanel } from "./panels/news-panel";
import { WatchlistPanel } from "./panels/watchlist-panel";
import { EconomicPanel } from "./panels/economic-panel";
import { MarketOverviewPanel } from "./panels/market-overview-panel";
import { CompaniesPanel } from "./panels/companies-panel";
import { FundamentalsPanel } from "./panels/fundamentals-panel";
import { ValuationPanel } from "./panels/valuation-panel";
import { FinancialsPanel } from "./panels/financials-panel";
import { RsiPanel } from "./panels/rsi-panel";
import { MacdPanel } from "./panels/macd-panel";
import { CommoditiesPanel } from "./panels/commodities-panel";
import { CurrenciesPanel } from "./panels/currencies-panel";
import { AiAssistantPanel } from "./panels/ai-assistant-panel";
import { HeatmapPanel } from "./panels/heatmap-panel";
import { SectorPanel } from "./panels/sector-panel";
import { PriceLevelsPanel } from "./panels/price-levels-panel";
import { VolumePanel } from "./panels/volume-panel";
import { EarningsPanel } from "./panels/earnings-panel";
import { YieldCurvePanel } from "./panels/yield-curve-panel";
import { MacroCalendarPanel } from "./panels/macro-calendar-panel";
import { InsiderPanel } from "./panels/insider-panel";
import { FilingsPanel } from "./panels/filings-panel";

const PANEL_ICONS: Record<string, React.ReactNode> = {
  chart: <LineChart size={12} className="text-zinc-500" />,
  "mini-chart": <LineChart size={12} className="text-zinc-500" />,
  movers: <TrendingUp size={12} className="text-zinc-500" />,
  news: <Newspaper size={12} className="text-zinc-500" />,
  watchlist: <Star size={12} className="text-zinc-500" />,
  economic: <BarChart3 size={12} className="text-zinc-500" />,
  market: <Globe size={12} className="text-zinc-500" />,
  companies: <Building2 size={12} className="text-zinc-500" />,
  fundamentals: <PieChart size={12} className="text-zinc-500" />,
  valuation: <DollarSign size={12} className="text-zinc-500" />,
  financials: <Table size={12} className="text-zinc-500" />,
  rsi: <Activity size={12} className="text-zinc-500" />,
  macd: <Waves size={12} className="text-zinc-500" />,
  commodities: <Coins size={12} className="text-zinc-500" />,
  currencies: <DollarSign size={12} className="text-zinc-500" />,
  "ai-assistant": <Bot size={12} className="text-zinc-500" />,
  heatmap: <Grid3x3 size={12} className="text-zinc-500" />,
  sectors: <Layers size={12} className="text-zinc-500" />,
  "price-levels": <Target size={12} className="text-zinc-500" />,
  volume: <BarChart size={12} className="text-zinc-500" />,
  earnings: <Calendar size={12} className="text-zinc-500" />,
  "yield-curve": <GitBranch size={12} className="text-zinc-500" />,
  "macro-calendar": <Calendar size={12} className="text-zinc-500" />,
  insider: <Users size={12} className="text-zinc-500" />,
  filings: <FileText size={12} className="text-zinc-500" />,
};

const PANEL_TITLES: Record<string, string> = {
  chart: "Chart",
  "mini-chart": "Mini Chart",
  movers: "Top Movers",
  news: "News",
  watchlist: "Watchlist",
  economic: "Economic",
  market: "Market Overview",
  companies: "Companies",
  fundamentals: "Fundamentals",
  valuation: "Valuation",
  financials: "Financials",
  rsi: "RSI",
  macd: "MACD",
  commodities: "Commodities",
  currencies: "Currencies",
  "ai-assistant": "AI Assistant",
  heatmap: "Heatmap",
  sectors: "Sectors",
  "price-levels": "Price Levels",
  volume: "Volume",
  earnings: "Earnings",
  "yield-curve": "Yield Curve",
  "macro-calendar": "Macro Calendar",
  insider: "Insider Trades",
  filings: "SEC Filings",
};

const STORAGE_KEY = "atlas-dashboard-layout";
const DEFAULT_LAYOUT = JSON.stringify([
  { id: "chart-1", type: "chart", x: 0, y: 0, w: 8, h: 4, config: { symbol: "AAPL", range: "1M" } },
  { id: "movers-1", type: "movers", x: 8, y: 0, w: 4, h: 4 },
  { id: "news-1", type: "news", x: 0, y: 4, w: 4, h: 3 },
  { id: "watchlist-1", type: "watchlist", x: 4, y: 4, w: 4, h: 3 },
  { id: "economic-1", type: "economic", x: 8, y: 4, w: 4, h: 3 },
]);

function DashboardBuilderInner() {
  const { panels, removePanel } = useLayout();
  const [minimized, setMinimized] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  const toggleMinimize = (id: string) => {
    setMinimized((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReset = () => {
    localStorage.setItem(STORAGE_KEY, DEFAULT_LAYOUT);
    window.location.reload();
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const renderPanelContent = (panel: { id: string; type: string }) => {
    switch (panel.type) {
      case "chart": return <ChartPanel id={panel.id} />;
      case "mini-chart": return <MiniChartPanel id={panel.id} />;
      case "movers": return <MoversPanel />;
      case "news": return <NewsPanel />;
      case "watchlist": return <WatchlistPanel />;
      case "economic": return <EconomicPanel />;
      case "market": return <MarketOverviewPanel />;
      case "companies": return <CompaniesPanel />;
      case "fundamentals": return <FundamentalsPanel id={panel.id} />;
      case "valuation": return <ValuationPanel id={panel.id} />;
      case "financials": return <FinancialsPanel id={panel.id} />;
      case "rsi": return <RsiPanel id={panel.id} />;
      case "macd": return <MacdPanel id={panel.id} />;
      case "commodities": return <CommoditiesPanel />;
      case "currencies": return <CurrenciesPanel />;
      case "ai-assistant": return <AiAssistantPanel id={panel.id} />;
      case "heatmap": return <HeatmapPanel />;
      case "sectors": return <SectorPanel />;
      case "price-levels": return <PriceLevelsPanel id={panel.id} />;
      case "volume": return <VolumePanel id={panel.id} />;
      case "earnings": return <EarningsPanel />;
      case "yield-curve": return <YieldCurvePanel />;
      case "macro-calendar": return <MacroCalendarPanel />;
      case "insider": return <InsiderPanel />;
      case "filings": return <FilingsPanel />;
      default: return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Unknown panel type</div>;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Drag panels to reorder, resize from bottom-right corner
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
          >
            {saved ? "Saved!" : "Save Layout"}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
          >
            <RotateCcw size={11} />
            Reset
          </button>
          <AddPanelMenu />
        </div>
      </div>

      {panels.map((panel) => (
        <PanelWrapper
          key={panel.id}
          id={panel.id}
          title={PANEL_TITLES[panel.type] ?? panel.type}
          icon={PANEL_ICONS[panel.type]}
          onRemove={() => removePanel(panel.id)}
          minimized={minimized.has(panel.id)}
          onToggleMinimize={() => toggleMinimize(panel.id)}
        >
          {renderPanelContent(panel)}
        </PanelWrapper>
      ))}
    </>
  );
}

export function DashboardBuilder() {
  return (
    <LayoutProvider>
      <div className="p-4 md:p-6">
        <DashboardBuilderInner />
      </div>
    </LayoutProvider>
  );
}
