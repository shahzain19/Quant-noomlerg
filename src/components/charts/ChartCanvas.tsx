"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChart } from "./ChartContext";
import type { ChartPadding } from "./types";

const COLORS = {
  grid: "#1a1a1e",
  gridText: "#52525b",
  up: "#22c55e",
  down: "#ef4444",
  volumeUp: "rgba(34,197,94,0.2)",
  volumeDown: "rgba(239,68,68,0.2)",
  crosshair: "rgba(161,161,170,0.25)",
  crosshairLabel: "#27272a",
  crosshairLabelText: "#e4e4e7",
  currentPrice: "#71717a",
  prevClose: "#3f3f46",
  selectionBg: "rgba(59,130,246,0.08)",
  selectionBorder: "rgba(59,130,246,0.3)",
};

function formatPrice(v: number, mode: string): string {
  if (mode === "percentage") return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  if (mode === "indexed") return v.toFixed(1);
  if (Math.abs(v) >= 1000) return `$${v.toFixed(0)}`;
  if (Math.abs(v) >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

function formatVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

function formatDateLabel(ts: string, range: string): string {
  const d = new Date(ts);
  if (range === "1D") return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (range === "5D") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChartCanvas() {
  const chart = useChart();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startViewStart: number; startViewEnd: number } | null>(null);
  const selectionRef = useRef<{ startIdx: number; endIdx: number } | null>(null);

  const {
    data, chartType, priceMode, range,
    activeOverlays, overlayData, bollingerData,
    viewStart, viewEnd, hover, showVolume, showEvents, events,
    comparisonSeries, comparisonIndexed,
    width, height,
    setViewRange, setHover, setDimensions,
  } = chart;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      setDimensions(w, h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [setDimensions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || width === 0 || height === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const pad: ChartPadding = {
      top: 8,
      right: 64,
      bottom: 32,
      left: 8,
    };
    const volH = showVolume ? Math.min(80, height * 0.18) : 0;
    const gapBetween = showVolume ? 4 : 0;
    const chartH = height - pad.top - pad.bottom - volH - gapBetween;
    const chartW = width - pad.left - pad.right;
    const chartTop = pad.top;

    ctx.clearRect(0, 0, width, height);

    const visibleData = data.slice(viewStart, viewEnd);
    if (!visibleData.length) return;

    const closes = visibleData.map((d) => d.close);
    const firstClose = data[Math.max(0, viewStart)]?.close ?? 1;

    let priceData: number[];
    if (priceMode === "percentage") {
      priceData = visibleData.map((d) => ((d.close - firstClose) / firstClose) * 100);
    } else if (priceMode === "indexed") {
      priceData = visibleData.map((d) => (d.close / firstClose) * 100);
    } else {
      priceData = closes;
    }

    let allPrices = [...priceData];
    const highs = visibleData.map((d) => d.high);
    const lows = visibleData.map((d) => d.low);
    if (priceMode === "absolute") {
      allPrices = [...highs, ...lows];
    }

    for (const [, overlayValues] of overlayData) {
      const sliced = overlayValues.slice(viewStart, viewEnd);
      for (const v of sliced) {
        if (v != null) allPrices.push(v);
      }
    }
    if (bollingerData) {
      for (const v of bollingerData.upper.slice(viewStart, viewEnd)) {
        if (v != null) allPrices.push(v);
      }
      for (const v of bollingerData.lower.slice(viewStart, viewEnd)) {
        if (v != null) allPrices.push(v);
      }
    }

    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const pRange = maxP - minP || 1;
    const pPad = pRange * 0.08;
    const pMin = minP - pPad;
    const pMax = maxP + pPad;
    const pTotal = pMax - pMin;

    const maxVol = Math.max(...visibleData.map((d) => d.volume ?? 0), 1);
    const xStep = visibleData.length > 1 ? chartW / (visibleData.length - 1) : chartW;
    const xPos = (i: number) => pad.left + i * xStep;
    const yPos = (p: number) => chartTop + (1 - (p - pMin) / pTotal) * chartH;

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = chartTop + (i / 5) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.gridText;
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = pMin + (pTotal * i) / 5;
      const y = chartTop + (1 - i / 5) * chartH;
      ctx.fillText(formatPrice(val, priceMode), width - 4, y + 3);
    }

    ctx.textAlign = "left";
    ctx.fillText(formatVol(maxVol), pad.left, chartTop + chartH + volH + gapBetween + 10);

    if (showVolume) {
      const volTop = chartTop + chartH + gapBetween;
      for (let i = 0; i < visibleData.length; i++) {
        const d = visibleData[i];
        const vol = d.volume ?? 0;
        const volBarH = (vol / maxVol) * volH;
        const x = xPos(i);
        const barW = Math.max(Math.min(xStep * 0.7, 12), 2);
        ctx.fillStyle = d.close >= d.open ? COLORS.volumeUp : COLORS.volumeDown;
        ctx.fillRect(x - barW / 2, volTop + volH - volBarH, barW, volBarH);
      }
    }

    if (bollingerData) {
      const upper = bollingerData.upper.slice(viewStart, viewEnd);
      const lower = bollingerData.lower.slice(viewStart, viewEnd);

      ctx.fillStyle = "rgba(139,92,246,0.06)";
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < upper.length; i++) {
        if (upper[i] == null || lower[i] == null) continue;
        const x = xPos(i);
        if (!started) {
          ctx.moveTo(x, yPos(upper[i]!));
          started = true;
        } else {
          ctx.lineTo(x, yPos(upper[i]!));
        }
      }
      for (let i = lower.length - 1; i >= 0; i--) {
        if (lower[i] == null) continue;
        ctx.lineTo(xPos(i), yPos(lower[i]!));
      }
      ctx.closePath();
      ctx.fill();

      const drawBandLine = (vals: (number | null)[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        let s = false;
        for (let i = 0; i < vals.length; i++) {
          if (vals[i] == null) continue;
          const x = xPos(i);
          if (!s) { ctx.moveTo(x, yPos(vals[i]!)); s = true; }
          else ctx.lineTo(x, yPos(vals[i]!));
        }
        ctx.stroke();
      };
      drawBandLine(upper, "rgba(139,92,246,0.5)");
      drawBandLine(lower, "rgba(139,92,246,0.5)");
    }

    for (const [, overlayValues] of overlayData) {
      const config = activeOverlays.find((o) => overlayData.get(o.id) === overlayValues);
      if (!config) continue;
      const sliced = overlayValues.slice(viewStart, viewEnd);
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < sliced.length; i++) {
        if (sliced[i] == null) continue;
        const x = xPos(i);
        const y = yPos(sliced[i]!);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (chartType === "candlestick") {
      for (let i = 0; i < visibleData.length; i++) {
        const d = visibleData[i];
        const x = xPos(i);
        const barW = Math.max(Math.min(xStep * 0.65, 14), 2);
        const bodyTop = yPos(Math.max(d.open, d.close));
        const bodyBot = yPos(Math.min(d.open, d.close));
        const bodyH = Math.max(bodyBot - bodyTop, 1);
        const bull = d.close >= d.open;

        ctx.strokeStyle = bull ? COLORS.up : COLORS.down;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yPos(d.high));
        ctx.lineTo(x, bodyTop);
        ctx.moveTo(x, bodyBot);
        ctx.lineTo(x, yPos(d.low));
        ctx.stroke();

        ctx.fillStyle = bull ? COLORS.up : COLORS.down;
        if (Math.abs(d.open - d.close) < (pTotal * 0.002)) {
          ctx.fillRect(x - barW / 2, bodyTop - 0.5, barW, 1.5);
        } else {
          if (bull) {
            ctx.fillRect(x - barW / 2, bodyTop, barW, bodyH);
          } else {
            ctx.fillRect(x - barW / 2, bodyTop, barW, bodyH);
          }
        }
      }
    } else {
      const lineColor = closes[0] <= closes[closes.length - 1] ? COLORS.up : COLORS.down;

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < priceData.length; i++) {
        const x = xPos(i);
        const y = yPos(priceData[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (chartType === "area") {
        const grad = ctx.createLinearGradient(0, chartTop, 0, chartTop + chartH);
        grad.addColorStop(0, lineColor === COLORS.up ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(xPos(0), chartTop + chartH);
        for (let i = 0; i < priceData.length; i++) {
          ctx.lineTo(xPos(i), yPos(priceData[i]));
        }
        ctx.lineTo(xPos(priceData.length - 1), chartTop + chartH);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (comparisonSeries.length > 0) {
      const compColors = ["#3b82f6", "#f59e0b", "#22c55e", "#a855f7", "#ec4899", "#14b8a6"];
      comparisonSeries.forEach((series, si) => {
        const indexed = comparisonIndexed.get(series.symbol);
        if (!indexed) return;
        const sliced = indexed.slice(viewStart, viewEnd);
        const color = compColors[si % compColors.length];

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < sliced.length; i++) {
          const x = xPos(i);
          const y = yPos(sliced[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    }

    if (showEvents && events.length > 0) {
      for (const ev of events) {
        const evDate = new Date(ev.date).getTime();
        let evIdx = -1;
        for (let i = 0; i < visibleData.length; i++) {
          if (Math.abs(new Date(visibleData[i].timestamp).getTime() - evDate) < 86400000 * 1.5) {
            evIdx = i;
            break;
          }
        }
        if (evIdx < 0) continue;
        const x = xPos(evIdx);
        const y = chartTop + 4;

        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const letter = ev.type === "earnings" ? "E" : ev.type === "dividend" ? "D" : ev.type === "split" ? "S" : "•";
        ctx.fillText(letter, x, y);
        ctx.textBaseline = "alphabetic";
      }
    }

    const lastPrice = data[data.length - 1]?.close;
    if (lastPrice != null && priceMode === "absolute") {
      const y = yPos(lastPrice);
      ctx.strokeStyle = COLORS.currentPrice;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = COLORS.up >= "#22c55e" ? COLORS.up : COLORS.down;
      const isUp = lastPrice >= (data[data.length - 2]?.close ?? lastPrice);
      ctx.fillStyle = isUp ? COLORS.up : COLORS.down;
      ctx.fillRect(width - pad.right + 2, y - 7, pad.right - 4, 14);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`$${lastPrice.toFixed(2)}`, width - pad.right + pad.right / 2, y + 3.5);
    }

    const prevClose = data.length > 1 ? data[data.length - 2]?.close : null;
    if (prevClose != null && priceMode === "absolute") {
      const y = yPos(prevClose);
      ctx.strokeStyle = COLORS.prevClose;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const step = visibleData.length > 60
      ? Math.floor(visibleData.length / 8)
      : visibleData.length > 20
        ? Math.floor(visibleData.length / 5)
        : Math.floor(visibleData.length / 3);
    ctx.fillStyle = COLORS.gridText;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i < visibleData.length; i += Math.max(step, 1)) {
      const x = xPos(i);
      const lbl = formatDateLabel(visibleData[i].timestamp, range);
      ctx.fillText(lbl, x, height - 8);
    }

    if (hover && hover.index >= 0 && hover.index < visibleData.length) {
      const hx = xPos(hover.index);

      ctx.strokeStyle = COLORS.crosshair;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, chartTop);
      ctx.lineTo(hx, chartTop + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      const d = visibleData[hover.index];
      let hy: number;
      if (chartType === "candlestick") {
        hy = yPos(d.close);
      } else {
        hy = yPos(priceData[hover.index]);
      }

      ctx.strokeStyle = COLORS.crosshair;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, hy);
      ctx.lineTo(width - pad.right, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(hx, hy, 3, 0, Math.PI * 2);
      ctx.fillStyle = d.close >= d.open ? COLORS.up : COLORS.down;
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();

      const labelY = Math.max(chartTop + 10, Math.min(hy, chartTop + chartH - 10));
      ctx.fillStyle = COLORS.crosshairLabel;
      const labelText = formatPrice(
        priceMode === "absolute" ? d.close : priceData[hover.index],
        priceMode
      );
      ctx.font = "10px monospace";
      const tw = ctx.measureText(labelText).width;
      ctx.fillRect(width - pad.right + 2, labelY - 7, tw + 8, 14);
      ctx.fillStyle = COLORS.crosshairLabelText;
      ctx.textAlign = "left";
      ctx.fillText(labelText, width - pad.right + 6, labelY + 3.5);
    }
  }, [
    data, chartType, priceMode, range, width, height,
    activeOverlays, overlayData, bollingerData,
    viewStart, viewEnd, hover, showVolume, showEvents, events,
    comparisonSeries, comparisonIndexed,
  ]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dataPerPx = (dragRef.current.startViewEnd - dragRef.current.startViewStart) / (width - 64);
        const dataShift = Math.round(-dx * dataPerPx);
        const range = dragRef.current.startViewEnd - dragRef.current.startViewStart;
        let newStart = dragRef.current.startViewStart + dataShift;
        let newEnd = dragRef.current.startViewEnd + dataShift;
        if (newStart < 0) { newStart = 0; newEnd = range; }
        if (newEnd > data.length) { newEnd = data.length; newStart = data.length - range; }
        setViewRange(newStart, newEnd);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas || !data.length || width === 0) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const pad = { left: 8, right: 64 };
      const chartW = width - pad.left - pad.right;
      const visibleLen = viewEnd - viewStart;
      const xStep = visibleLen > 1 ? chartW / (visibleLen - 1) : chartW;
      const idx = Math.round((mx - pad.left) / xStep);
      const clamped = Math.max(0, Math.min(visibleLen - 1, idx));
      setHover({ index: clamped, x: mx, y: e.clientY - rect.top });
    },
    [data, width, viewStart, viewEnd, setViewRange, setHover]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragRef.current = {
        startX: e.clientX,
        startViewStart: viewStart,
        startViewEnd: viewEnd,
      };

      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mouseup", onUp);
    },
    [viewStart, viewEnd]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const pad = { left: 8, right: 64 };
      const chartW = width - pad.left - pad.right;
      const ratio = (mx - pad.left) / chartW;

      const range = viewEnd - viewStart;
      const delta = e.deltaY > 0 ? 1.15 : 0.87;
      let newRange = Math.round(range * delta);
      newRange = Math.max(10, Math.min(data.length, newRange));

      const pivot = viewStart + Math.round(range * ratio);
      let newStart = Math.round(pivot - newRange * ratio);
      let newEnd = newStart + newRange;

      if (newStart < 0) { newStart = 0; newEnd = newRange; }
      if (newEnd > data.length) { newEnd = data.length; newStart = data.length - newRange; }

      setViewRange(newStart, newEnd);
    },
    [data.length, viewStart, viewEnd, width, setViewRange]
  );

  const handleMouseLeave = useCallback(() => {
    setHover(null);
    dragRef.current = null;
  }, [setHover]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        style={{ width, height, cursor: dragRef.current ? "grabbing" : "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onMouseLeave={handleMouseLeave}
        className="block"
      />
    </div>
  );
}
