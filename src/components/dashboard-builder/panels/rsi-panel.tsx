"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLayout } from "../layout/layout-context";
import { rsi } from "@/components/charts/indicators/calculations";
import type { PricePoint } from "@/types";

export function RsiPanel({ id }: { id: string }) {
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
    const rsiData = rsi(closes, 14);
    const visible = rsiData.slice(-Math.min(data.length, 200));
    const validRsi = visible.filter((v): v is number => v != null);
    if (!validRsi.length) return;

    const xStep = chartW / Math.max(visible.length - 1, 1);
    const xPos = (i: number) => pad.left + i * xStep;
    const yPos = (v: number) => pad.top + (1 - v / 100) * chartH;

    ctx.strokeStyle = "#1a1a1e";
    ctx.lineWidth = 0.5;
    for (const level of [30, 50, 70]) {
      const y = yPos(level);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(dims.w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = "#52525b";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(level.toString(), dims.w - 4, y + 3);
    }

    ctx.fillStyle = "rgba(239,68,68,0.06)";
    ctx.fillRect(pad.left, yPos(30), chartW, yPos(0) - yPos(30));
    ctx.fillStyle = "rgba(34,197,94,0.06)";
    ctx.fillRect(pad.left, yPos(100), chartW, yPos(70) - yPos(100));

    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < visible.length; i++) {
      if (visible[i] == null) continue;
      const x = xPos(i);
      const y = yPos(visible[i]!);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "#52525b";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("RSI (14)", pad.left + 4, pad.top + 12);
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
        <span className="text-[10px] text-zinc-600">RSI (14)</span>
      </form>
      <div ref={containerRef} className="flex-1 min-h-0">
        <canvas ref={canvasRef} style={{ width: dims.w, height: dims.h }} className="block" />
      </div>
    </div>
  );
}
