import type { PricePoint, ChartRange } from "@/types";

export type ChartType = "candlestick" | "line" | "area";
export type PriceMode = "absolute" | "percentage" | "indexed";

export interface ChartEvent {
  date: string;
  type: "earnings" | "dividend" | "split" | "announcement" | "news";
  label: string;
  description?: string;
}

export interface OverlayConfig {
  id: string;
  type: "sma" | "ema" | "bollinger" | "vwap";
  period?: number;
  color: string;
  label: string;
}

export interface ComparisonSeries {
  symbol: string;
  name: string;
  data: PricePoint[];
  color: string;
}

export interface ChartViewport {
  start: number;
  end: number;
}

export interface HoverInfo {
  index: number;
  x: number;
  y: number;
}

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const OVERLAY_PRESETS: OverlayConfig[] = [
  { id: "sma-20", type: "sma", period: 20, color: "#f59e0b", label: "SMA 20" },
  { id: "sma-50", type: "sma", period: 50, color: "#3b82f6", label: "SMA 50" },
  { id: "sma-100", type: "sma", period: 100, color: "#22d3ee", label: "SMA 100" },
  { id: "sma-200", type: "sma", period: 200, color: "#a855f7", label: "SMA 200" },
  { id: "ema-20", type: "ema", period: 20, color: "#f97316", label: "EMA 20" },
  { id: "ema-50", type: "ema", period: 50, color: "#ec4899", label: "EMA 50" },
  { id: "bollinger", type: "bollinger", period: 20, color: "#8b5cf6", label: "Bollinger" },
  { id: "vwap", type: "vwap", color: "#14b8a6", label: "VWAP" },
];

export const COMPARISON_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#22c55e",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#ef4444",
];

export const RANGE_OPTIONS: ChartRange[] = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y", "MAX"];
