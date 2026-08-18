"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PricePoint, ChartRange } from "@/types";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: ChartRange[] = ["1D", "5D", "1M", "6M", "1Y", "5Y", "MAX"];

function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j];
      result.push(sum / period);
    }
  }
  return result;
}

function formatVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

interface Props {
  data: PricePoint[];
  symbol: string;
  range?: ChartRange;
  onRangeChange?: (range: ChartRange) => void;
  height?: number;
  compact?: boolean;
}

export function StockChart({ data, symbol, range = "1M", onRangeChange, height = 400, compact = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; idx: number } | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const closes = data.map((d) => d.close);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);

  const positive = (closes[0] ?? 0) <= (closes[closes.length - 1] ?? 0);
  const lineColor = positive ? "#22c55e" : "#ef4444";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || dims.w === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.w * dpr;
    canvas.height = dims.h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 12, right: compact ? 4 : 56, bottom: 24, left: 4 };
    const volH = compact ? 0 : dims.h * 0.18;
    const chartH = dims.h - pad.top - pad.bottom - volH - (compact ? 0 : 4);
    const chartW = dims.w - pad.left - pad.right;
    const chartTop = pad.top;

    ctx.clearRect(0, 0, dims.w, dims.h);

    const allPrices = data.flatMap((d) => [d.high, d.low, ...[sma20, sma50, sma200].map((s) => s[data.indexOf(d)]).filter((v): v is number => v != null)]);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const pRange = maxP - minP || 1;
    const pPad = pRange * 0.05;
    const pMin = minP - pPad;
    const pMax = maxP + pPad;
    const pTotal = pMax - pMin;

    const maxVol = Math.max(...data.map((d) => d.volume ?? 0), 1);

    const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;
    const xPos = (i: number) => pad.left + i * xStep;
    const yPos = (p: number) => chartTop + (1 - (p - pMin) / pTotal) * chartH;

    ctx.strokeStyle = "#1e1e22";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = chartTop + (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(dims.w - pad.right, y);
      ctx.stroke();
    }

    if (!compact) {
      ctx.fillStyle = "#52525b";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      for (let i = 0; i <= 4; i++) {
        const val = pMin + (pTotal * i) / 4;
        const y = chartTop + (1 - i / 4) * chartH;
        ctx.fillText(`$${val.toFixed(2)}`, dims.w - 4, y + 3);
      }

      const volTop = chartTop + chartH + 4;
      ctx.fillStyle = "#52525b";
      ctx.textAlign = "left";
      ctx.fillText(formatVol(maxVol), pad.left, volTop + 10);
    }

    if (!compact) {
      const volTop = chartTop + chartH + 4;
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const vol = d.volume ?? 0;
        const volBarH = (vol / maxVol) * volH;
        const x = xPos(i);
        const barW = Math.max(xStep * 0.6, 2);
        ctx.fillStyle = d.close >= d.open ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)";
        ctx.fillRect(x - barW / 2, volTop + volH - volBarH, barW, volBarH);
      }
    }

    const drawMA = (vals: (number | null)[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < vals.length; i++) {
        if (vals[i] == null) continue;
        const x = xPos(i);
        const y = yPos(vals[i]!);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    drawMA(sma20, "#f59e0b");
    drawMA(sma50, "#3b82f6");
    if (data.length > 50) drawMA(sma200, "#a855f7");

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = xPos(i);
      const y = yPos(data[i].close);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, chartTop, 0, chartTop + chartH);
    grad.addColorStop(0, positive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(xPos(0), chartTop + chartH);
    for (let i = 0; i < data.length; i++) {
      ctx.lineTo(xPos(i), yPos(data[i].close));
    }
    ctx.lineTo(xPos(data.length - 1), chartTop + chartH);
    ctx.closePath();
    ctx.fill();

    if (hover && hover.idx >= 0 && hover.idx < data.length) {
      const hx = xPos(hover.idx);

      ctx.strokeStyle = "rgba(161,161,170,0.3)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, chartTop);
      ctx.lineTo(hx, chartTop + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      const d = data[hover.idx];
      const hy = yPos(d.close);
      ctx.beginPath();
      ctx.arc(hx, hy, 3, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!compact) {
        ctx.beginPath();
        ctx.moveTo(hx - 4, chartTop);
        ctx.lineTo(hx + 4, chartTop);
        ctx.moveTo(hx, chartTop);
        ctx.lineTo(hx, chartTop + 6);
        ctx.stroke();
      }
    }

    if (!compact) {
      ctx.fillStyle = "#52525b";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const step = data.length > 60 ? Math.floor(data.length / 6) : data.length > 20 ? Math.floor(data.length / 4) : Math.floor(data.length / 3);
      for (let i = 0; i < data.length; i += Math.max(step, 1)) {
        const x = xPos(i);
        const lbl = new Date(data[i].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        ctx.fillText(lbl, x, dims.h - 6);
      }
    }
  }, [data, dims, hover, lineColor, sma20, sma50, sma200, compact, positive]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !data.length || dims.w === 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const pad = { left: 4, right: compact ? 4 : 56 };
      const chartW = dims.w - pad.left - pad.right;
      const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;
      const idx = Math.round((mx - pad.left) / xStep);
      const clamped = Math.max(0, Math.min(data.length - 1, idx));
      setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx: clamped });
    },
    [data, dims.w, compact]
  );

  const handleMouseLeave = useCallback(() => setHover(null), []);

  const tooltipData = hover && hover.idx >= 0 && hover.idx < data.length ? data[hover.idx] : null;

  return (
    <div className="w-full">
      {!compact && onRangeChange && (
        <div className="flex items-center gap-1 mb-2">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={cn(
                "px-2 py-0.5 text-[11px] font-mono rounded transition-colors",
                range === r ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {r}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[10px]">
            <span className="text-amber-500">SMA 20</span>
            <span className="text-blue-500">SMA 50</span>
            <span className="text-purple-500">SMA 200</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="relative w-full" style={{ height }}>
        <canvas
          ref={canvasRef}
          style={{ width: dims.w, height: dims.h }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
        />
        {tooltipData && hover && (
          <div
            className="absolute z-50 pointer-events-none bg-zinc-900 border border-zinc-700 rounded p-2 text-[11px] font-mono shadow-lg"
            style={{
              left: Math.min(hover.x + 12, dims.w - 180),
              top: Math.max(hover.y - 80, 4),
            }}
          >
            <div className="text-zinc-400 mb-1">
              {new Date(tooltipData.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span className="text-zinc-500">O</span>
              <span className="text-zinc-200 text-right">${tooltipData.open.toFixed(2)}</span>
              <span className="text-zinc-500">H</span>
              <span className="text-zinc-200 text-right">${tooltipData.high.toFixed(2)}</span>
              <span className="text-zinc-500">L</span>
              <span className="text-zinc-200 text-right">${tooltipData.low.toFixed(2)}</span>
              <span className="text-zinc-500">C</span>
              <span className={cn("text-right", tooltipData.close >= tooltipData.open ? "text-green-400" : "text-red-400")}>
                ${tooltipData.close.toFixed(2)}
              </span>
              <span className="text-zinc-500">Vol</span>
              <span className="text-zinc-200 text-right">{formatVol(tooltipData.volume ?? 0)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
