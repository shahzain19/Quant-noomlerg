"use client";

import { useChart } from "./ChartContext";
import { cn } from "@/lib/utils";

function formatVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

export function ChartTooltip() {
  const { data, hover, viewStart, viewEnd, priceMode, overlayData, activeOverlays, width } = useChart();

  if (!hover || hover.index == null) return null;

  const visibleData = data.slice(viewStart, viewEnd);
  const d = visibleData[hover.index];
  if (!d) return null;

  const prev = hover.index > 0 ? visibleData[hover.index - 1] : null;
  const change = prev ? d.close - prev.close : 0;
  const changePct = prev ? (change / prev.close) * 100 : 0;
  const isUp = d.close >= d.open;

  const tooltipWidth = 200;
  const tooltipX = Math.min(hover.x + 16, width - tooltipWidth - 8);
  const tooltipY = Math.max(hover.y - 120, 8);

  return (
    <div
      className="absolute z-50 pointer-events-none bg-zinc-900/95 border border-zinc-700 rounded-md p-2.5 shadow-2xl shadow-black/60 backdrop-blur-sm"
      style={{
        left: tooltipX,
        top: tooltipY,
        width: tooltipWidth,
      }}
    >
      <div className="text-[10px] text-zinc-500 mb-1.5 font-mono">
        {new Date(d.timestamp).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] font-mono">
        <span className="text-zinc-500">Open</span>
        <span className="text-zinc-200 text-right">${d.open.toFixed(2)}</span>
        <span className="text-zinc-500">High</span>
        <span className="text-zinc-200 text-right">${d.high.toFixed(2)}</span>
        <span className="text-zinc-500">Low</span>
        <span className="text-zinc-200 text-right">${d.low.toFixed(2)}</span>
        <span className="text-zinc-500">Close</span>
        <span className={cn("text-right font-semibold", isUp ? "text-green-400" : "text-red-400")}>
          ${d.close.toFixed(2)}
        </span>
        <span className="text-zinc-500">Volume</span>
        <span className="text-zinc-200 text-right">{formatVol(d.volume ?? 0)}</span>
      </div>

      {prev && (
        <div className="mt-1.5 pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono">
          <span className="text-zinc-500">Change</span>
          <span className={cn("font-semibold", isUp ? "text-green-400" : "text-red-400")}>
            {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePct.toFixed(2)}%)
          </span>
        </div>
      )}

      {activeOverlays.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-zinc-800 space-y-0.5">
          {activeOverlays.map((overlay) => {
            const values = overlayData.get(overlay.id);
            const val = values?.slice(viewStart, viewEnd)[hover.index];
            if (val == null) return null;
            return (
              <div key={overlay.id} className="flex items-center justify-between text-[10px] font-mono">
                <span style={{ color: overlay.color }}>{overlay.label}</span>
                <span className="text-zinc-300">${val.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
