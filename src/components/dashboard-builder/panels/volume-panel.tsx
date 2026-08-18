"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLayout } from "../layout/layout-context";
import type { PricePoint } from "@/types";

export function VolumePanel({ id }: { id: string }) {
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

    const volumes = data.map((d) => d.volume ?? 0);
    const maxVol = Math.max(...volumes, 1);
    const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    const barW = Math.max(Math.min(chartW / data.length * 0.7, 12), 2);
    const gap = chartW / data.length;

    for (let i = 0; i < data.length; i++) {
      const vol = volumes[i];
      const barH = (vol / maxVol) * chartH;
      const x = pad.left + i * gap + (gap - barW) / 2;
      const isHigh = vol > avgVol * 1.5;
      const d = data[i];

      if (isHigh) {
        ctx.fillStyle = d.close >= d.open ? "rgba(34,197,94,0.8)" : "rgba(239,68,68,0.8)";
      } else {
        ctx.fillStyle = d.close >= d.open ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)";
      }
      ctx.fillRect(x, pad.top + chartH - barH, barW, barH);
    }

    const avgY = pad.top + chartH - (avgVol / maxVol) * chartH;
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, avgY);
    ctx.lineTo(dims.w - pad.right, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Avg: ${(avgVol / 1e6).toFixed(1)}M`, pad.left + 4, avgY - 4);

    const latestVol = volumes[volumes.length - 1] ?? 0;
    const ratio = avgVol > 0 ? latestVol / avgVol : 0;
    ctx.fillStyle = ratio > 1.5 ? "#22c55e" : ratio < 0.5 ? "#ef4444" : "#52525b";
    ctx.textAlign = "right";
    ctx.fillText(`${ratio.toFixed(1)}× avg`, dims.w - pad.right - 4, avgY - 4);

    ctx.fillStyle = "#52525b";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 3; i++) {
      const vol = (maxVol * i) / 3;
      const y = pad.top + chartH - (vol / maxVol) * chartH;
      const label = vol >= 1e6 ? `${(vol / 1e6).toFixed(0)}M` : vol >= 1e3 ? `${(vol / 1e3).toFixed(0)}K` : vol.toFixed(0);
      ctx.fillText(label, dims.w - 4, y + 3);
    }
  }, [data, dims]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (symbolInput.trim()) updatePanelConfig(id, { symbol: symbolInput.trim().toUpperCase() });
    },
    [id, symbolInput, updatePanelConfig]
  );

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading {symbol}...</div>;

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
        <span className="text-[10px] text-zinc-600">Volume Analysis</span>
      </form>
      <div ref={containerRef} className="flex-1 min-h-0">
        <canvas ref={canvasRef} style={{ width: dims.w, height: dims.h }} className="block" />
      </div>
    </div>
  );
}
