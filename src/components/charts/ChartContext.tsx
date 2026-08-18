"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { PricePoint, ChartRange } from "@/types";
import type { ChartType, PriceMode, OverlayConfig, ComparisonSeries, ChartEvent, HoverInfo } from "./types";
import { OVERLAY_PRESETS } from "./types";
import { computeOverlay, computeBollingerBands, toIndexed } from "./indicators/calculations";

interface ChartState {
  data: PricePoint[];
  symbol: string;
  chartType: ChartType;
  priceMode: PriceMode;
  range: ChartRange;
  activeOverlays: OverlayConfig[];
  overlayData: Map<string, (number | null)[]>;
  bollingerData: { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } | null;
  viewStart: number;
  viewEnd: number;
  hover: HoverInfo | null;
  showVolume: boolean;
  showEvents: boolean;
  events: ChartEvent[];
  comparisonSeries: ComparisonSeries[];
  comparisonIndexed: Map<string, number[]>;
  fullscreen: boolean;
  width: number;
  height: number;
}

interface ChartContextValue extends ChartState {
  setChartType: (type: ChartType) => void;
  setPriceMode: (mode: PriceMode) => void;
  setRange: (range: ChartRange) => void;
  toggleOverlay: (config: OverlayConfig) => void;
  setViewRange: (start: number, end: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setHover: (hover: HoverInfo | null) => void;
  toggleVolume: () => void;
  toggleEvents: () => void;
  setEvents: (events: ChartEvent[]) => void;
  addComparison: (series: ComparisonSeries) => void;
  removeComparison: (symbol: string) => void;
  toggleFullscreen: () => void;
  setDimensions: (w: number, h: number) => void;
}

const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within ChartProvider");
  return ctx;
}

const ZOOM_STEP = 0.15;
const MIN_VISIBLE_POINTS = 10;

interface ChartProviderProps {
  data: PricePoint[];
  symbol: string;
  range?: ChartRange;
  events?: ChartEvent[];
  initialOverlays?: string[];
  children: ReactNode;
}

export function ChartProvider({
  data,
  symbol,
  range = "1M",
  events = [],
  initialOverlays = [],
  children,
}: ChartProviderProps) {
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [priceMode, setPriceMode] = useState<PriceMode>("absolute");
  const [currentRange, setRange] = useState<ChartRange>(range);
  const [activeOverlays, setActiveOverlays] = useState<OverlayConfig[]>(
    OVERLAY_PRESETS.filter((o) => initialOverlays.includes(o.id))
  );
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(data.length);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [chartEvents, setChartEvents] = useState<ChartEvent[]>(events);
  const [comparisonSeries, setComparisonSeries] = useState<ComparisonSeries[]>([]);
  const [comparisonIndexed, setComparisonIndexed] = useState<Map<string, number[]>>(new Map());
  const [fullscreen, setFullscreen] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const overlayData = useMemo(() => {
    const map = new Map<string, (number | null)[]>();
    for (const config of activeOverlays) {
      if (config.type === "bollinger") continue;
      map.set(config.id, computeOverlay(data, config));
    }
    return map;
  }, [data, activeOverlays]);

  const bollingerData = useMemo(() => {
    const bollinger = activeOverlays.find((o) => o.type === "bollinger");
    if (!bollinger) return null;
    return computeBollingerBands(data, bollinger.period ?? 20);
  }, [data, activeOverlays]);

  const compIndexed = useMemo(() => {
    const map = new Map<string, number[]>();
    const baseIdx = Math.min(viewStart, data.length - 1);
    for (const s of comparisonSeries) {
      const merged = data.map((d, i) => {
        const match = s.data.find((sd) => sd.timestamp === d.timestamp);
        return match?.close ?? (i > 0 ? s.data[s.data.length - 1]?.close ?? 100 : 100);
      });
      map.set(s.symbol, toIndexed(merged.map((close, i) => ({
        timestamp: data[i]?.timestamp ?? "",
        open: close,
        high: close,
        low: close,
        close,
        volume: 0,
      })), baseIdx));
    }
    return map;
  }, [comparisonSeries, data, viewStart]);

  const toggleOverlay = useCallback((config: OverlayConfig) => {
    setActiveOverlays((prev) => {
      const exists = prev.find((o) => o.id === config.id);
      if (exists) return prev.filter((o) => o.id !== config.id);
      return [...prev, config];
    });
  }, []);

  const zoomIn = useCallback(() => {
    const range = viewEnd - viewStart;
    const newRange = Math.max(MIN_VISIBLE_POINTS, Math.floor(range * (1 - ZOOM_STEP)));
    const center = Math.floor((viewStart + viewEnd) / 2);
    const half = Math.floor(newRange / 2);
    setViewStart(Math.max(0, center - half));
    setViewEnd(Math.min(data.length, center + half));
  }, [viewStart, viewEnd, data.length]);

  const zoomOut = useCallback(() => {
    const range = viewEnd - viewStart;
    const newRange = Math.min(data.length, Math.floor(range * (1 + ZOOM_STEP)));
    const center = Math.floor((viewStart + viewEnd) / 2);
    const half = Math.floor(newRange / 2);
    setViewStart(Math.max(0, center - half));
    setViewEnd(Math.min(data.length, center + half));
  }, [viewStart, viewEnd, data.length]);

  const resetZoom = useCallback(() => {
    setViewStart(0);
    setViewEnd(data.length);
  }, [data.length]);

  const addComparison = useCallback((series: ComparisonSeries) => {
    setComparisonSeries((prev) => {
      const filtered = prev.filter((s) => s.symbol !== series.symbol);
      return [...filtered, series];
    });
  }, []);

  const removeComparison = useCallback((symbol: string) => {
    setComparisonSeries((prev) => prev.filter((s) => s.symbol !== symbol));
  }, []);

  const value = useMemo<ChartContextValue>(
    () => ({
      data,
      symbol,
      chartType,
      priceMode,
      range: currentRange,
      activeOverlays,
      overlayData,
      bollingerData,
      viewStart,
      viewEnd,
      hover,
      showVolume,
      showEvents,
      events: chartEvents,
      comparisonSeries,
      comparisonIndexed: compIndexed,
      fullscreen,
      width,
      height,
      setChartType,
      setPriceMode,
      setRange,
      toggleOverlay,
      setViewRange: (start, end) => {
        setViewStart(Math.max(0, start));
        setViewEnd(Math.min(data.length, end));
      },
      zoomIn,
      zoomOut,
      resetZoom,
      setHover,
      toggleVolume: () => setShowVolume((v) => !v),
      toggleEvents: () => setShowEvents((v) => !v),
      setEvents: setChartEvents,
      addComparison,
      removeComparison,
      toggleFullscreen: () => setFullscreen((f) => !f),
      setDimensions: (w, h) => {
        setWidth(w);
        setHeight(h);
      },
    }),
    [
      data, symbol, chartType, priceMode, currentRange,
      activeOverlays, overlayData, bollingerData,
      viewStart, viewEnd, hover, showVolume, showEvents, chartEvents,
      comparisonSeries, compIndexed, fullscreen, width, height,
      toggleOverlay, zoomIn, zoomOut, resetZoom,
      addComparison, removeComparison,
    ]
  );

  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
}
