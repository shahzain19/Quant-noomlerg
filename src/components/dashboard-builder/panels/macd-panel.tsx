"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLayout } from "../layout/layout-context";
import { macd } from "@/components/charts/indicators/calculations";
import type { PricePoint } from "@/types";

export function MacdPanel({ id }: { id: string }) {
  const { panels, updatePanelConfig } = useLayout();
  const panel = panels.find((p) => p.id === id);
  const symbol = (panel?.config?.symbol as string) ?? "AAPL";
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbolInput, setSymbolInput] = useState(symbol);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/companies/${encodeURIComponent(symbol)}/prices?range=3M`)
      .then((r) => r.json())
      .then((d: PricePoint[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length || dims.w === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.w * dpr;
    canvas.height = dims.h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 8, right: 40, bottom: 20, left: 4 };
    const chartH = dims.h - pad.top - pad.bottom;
    const chartW = dims.w - pad.left - pad.right;

    ctx.clearRect(0, 0, dims.w, dims.h);

    const closes = data.map((d) => d.close);
    const { macd: macdLine, signal, histogram } = macd(closes, 12, 26, 9);
    const n = Math.min(macdLine.length, 200);
    const startIdx = Math.max(0, macdLine.length - n);
    const visMacd = macdLine.slice(startIdx);
    const visSignal = signal.slice(startIdx);
    const visHist = histogram.slice(startIdx);

    const allVals = [...visMacd, ...visSignal].filter((v): v is number => v != null);
    if (!allVals.length) return;
    const minV = Math.min(...allVals, 0);
    const maxV = Math.max(...allVals, 0);
    const range = maxV - minV || 1;
    const pPad = range * 0.1;
    const pMin = minV - pPad;
    const pMax = maxV + pPad;

    const xStep = chartW / Math.max(visMacd.length - 1, 1);
    const xPos = (i: number) => pad.left + i * xStep;
    const yPos = (v: number) => pad.top + (1 - (v - pMin) / (pMax - pMin)) * chartH;

    ctx.strokeStyle = "#1a1a1e";
    ctx.lineWidth = 0.5;
    const zeroY = yPos(0);
    ctx.beginPath();
    ctx.moveTo(pad.left, zeroY);
    ctx.lineTo(dims.w - pad.right, zeroY);
    ctx.stroke();

    for (let i = 0; i < visHist.length; i++) {
      if (visHist[i] == null) continue;
      const x = xPos(i);
      const barW = Math.max(Math.min(xStep * 0.6, 8), 2);
      const val = visHist[i]!;
      const y = yPos(val);
      ctx.fillStyle = val >= 0 ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)";
      if (val >= 0) {
        ctx.fillRect(x - barW / 2, y, barW, zeroY - y);
      } else {
        ctx.fillRect(x - barW / 2, zeroY, barW, y - zeroY);
      }
    }

    const drawLine = (vals: (number | null)[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < vals.length; i++) {
        if (vals[i] == null) continue;
        const x = xPos(i);
        const y = yPos(vals[i]!);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawLine(visMacd, "#3b82f6");
    drawLine(visSignal, "#f59e0b");

    ctx.fillStyle = "#52525b";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("MACD (12,26,9)", pad.left + 4, pad.top + 12);
  }, [data, dims]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (symbolInput.trim()) updatePanelConfig(id, { symbol: symbolInput.trim().toUpperCase() });
    },
    [id, symbolInput, updatePanelConfig]
  );

  if (loading) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading {symbol}...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-2 pt-1 pb-0.5">
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          className="px-2 py-0.5 text-[11px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-200 w-16 focus:outline-none focus:border-zinc-500"
          placeholder="AAPL"
        />
        <span className="text-[10px] text-zinc-600">MACD (12,26,9)</span>
      </form>
      <div ref={containerRef} className="flex-1 min-h-0">
        <canvas ref={canvasRef} style={{ width: dims.w, height: dims.h }} className="block" />
      </div>
    </div>
  );
}
