"use client";

import { useState, useRef, useEffect } from "react";
import {
  CandlestickChart,
  LineChart,
  AreaChart,
  Maximize2,
  Minimize2,
  BarChart3,
  TrendingUp,
  X,
  Plus,
} from "lucide-react";
import { useChart } from "./ChartContext";
import { OVERLAY_PRESETS, RANGE_OPTIONS } from "./types";
import type { ChartType, OverlayConfig } from "./types";
import { cn } from "@/lib/utils";

const CHART_TYPES: { type: ChartType; icon: typeof CandlestickChart; label: string }[] = [
  { type: "candlestick", icon: CandlestickChart, label: "Candles" },
  { type: "line", icon: LineChart, label: "Line" },
  { type: "area", icon: AreaChart, label: "Area" },
];

export function ChartToolbar({ onCompareClick }: { onCompareClick?: () => void }) {
  const chart = useChart();
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIndicatorsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <div className="flex items-center border border-zinc-800 rounded overflow-hidden">
        {CHART_TYPES.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => chart.setChartType(type)}
            className={cn(
              "px-2 py-1 text-[10px] font-medium flex items-center gap-1 transition-colors",
              chart.chartType === type
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            )}
            title={label}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-zinc-800 mx-1" />

      <div className="flex items-center gap-0.5">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => chart.setRange(r)}
            className={cn(
              "px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors",
              chart.range === r
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-zinc-800 mx-1" />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIndicatorsOpen(!indicatorsOpen)}
          className={cn(
            "px-2 py-1 text-[10px] font-medium flex items-center gap-1 rounded transition-colors",
            chart.activeOverlays.length > 0
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
              : "text-zinc-500 hover:text-zinc-300 border border-zinc-800"
          )}
        >
          <TrendingUp size={11} />
          Indicators
          {chart.activeOverlays.length > 0 && (
            <span className="bg-blue-500 text-white text-[8px] px-1 rounded-full">
              {chart.activeOverlays.length}
            </span>
          )}
        </button>

        {indicatorsOpen && (
          <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-50 py-1 min-w-[160px]">
            <div className="px-2 py-1 text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">
              Moving Averages
            </div>
            {OVERLAY_PRESETS.filter((o) => o.type === "sma" || o.type === "ema").map((preset) => (
              <OverlayToggle key={preset.id} preset={preset} chart={chart} />
            ))}
            <div className="border-t border-zinc-800 my-1" />
            <div className="px-2 py-1 text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">
              Overlays
            </div>
            {OVERLAY_PRESETS.filter((o) => o.type === "bollinger" || o.type === "vwap").map((preset) => (
              <OverlayToggle key={preset.id} preset={preset} chart={chart} />
            ))}
          </div>
        )}
      </div>

      {onCompareClick && (
        <button
          onClick={onCompareClick}
          className={cn(
            "px-2 py-1 text-[10px] font-medium flex items-center gap-1 rounded transition-colors",
            chart.comparisonSeries.length > 0
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-zinc-500 hover:text-zinc-300 border border-zinc-800"
          )}
        >
          <Plus size={11} />
          Compare
        </button>
      )}

      <button
        onClick={chart.toggleVolume}
        className={cn(
          "px-2 py-1 text-[10px] font-medium flex items-center gap-1 rounded transition-colors",
          chart.showVolume
            ? "bg-zinc-800 text-zinc-200"
            : "text-zinc-500 hover:text-zinc-300"
        )}
      >
        <BarChart3 size={11} />
        Vol
      </button>

      <button
        onClick={chart.toggleEvents}
        className={cn(
          "px-2 py-1 text-[10px] font-medium rounded transition-colors",
          chart.showEvents
            ? "bg-zinc-800 text-zinc-200"
            : "text-zinc-500 hover:text-zinc-300"
        )}
      >
        Events
      </button>

      <div className="ml-auto">
        <div className="flex items-center gap-0.5 border border-zinc-800 rounded overflow-hidden">
          {(["absolute", "percentage", "indexed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => chart.setPriceMode(mode)}
              className={cn(
                "px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                chart.priceMode === mode
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {mode === "absolute" ? "$" : mode === "percentage" ? "%" : "100"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={chart.zoomIn}
        className="px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded transition-colors"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={chart.zoomOut}
        className="px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded transition-colors"
        title="Zoom out"
      >
        −
      </button>
      <button
        onClick={chart.resetZoom}
        className="px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded transition-colors"
        title="Reset zoom"
      >
        Reset
      </button>

      <button
        onClick={chart.toggleFullscreen}
        className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
        title={chart.fullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {chart.fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
      </button>
    </div>
  );
}

function OverlayToggle({ preset, chart }: { preset: OverlayConfig; chart: ReturnType<typeof useChart> }) {
  const active = chart.activeOverlays.some((o) => o.id === preset.id);
  return (
    <button
      onClick={() => chart.toggleOverlay(preset)}
      className="w-full flex items-center gap-2 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800 transition-colors"
    >
      <div
        className={cn("w-2 h-2 rounded-full border", active ? "border-transparent" : "border-zinc-600")}
        style={{ backgroundColor: active ? preset.color : "transparent" }}
      />
      <span className="flex-1 text-left">{preset.label}</span>
      {active && <X size={10} className="text-zinc-500" />}
    </button>
  );
}
