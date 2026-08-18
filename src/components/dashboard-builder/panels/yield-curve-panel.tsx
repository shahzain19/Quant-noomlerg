"use client";

import { useEffect, useState, useRef } from "react";
import type { YieldCurvePoint } from "@/lib/providers/adapters/yield-curve";

export function YieldCurvePanel() {
  const [data, setData] = useState<YieldCurvePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setLoading(true);
    fetch("/api/economy?type=yield_curve")
      .then((r) => r.json())
      .then((d: YieldCurvePoint[]) => {
        setData(d);
        if (d.length > 0) setDate(d[0].date);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

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

    const pad = { top: 16, right: 48, bottom: 32, left: 48 };
    const chartH = dims.h - pad.top - pad.bottom;
    const chartW = dims.w - pad.left - pad.right;

    ctx.clearRect(0, 0, dims.w, dims.h);

    const curveData = data.filter((d) => d.date === date).sort((a, b) => {
      const order = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"];
      return order.indexOf(a.maturity) - order.indexOf(b.maturity);
    });

    if (!curveData.length) return;

    const yields = curveData.map((d) => d.yieldValue);
    const minY = Math.min(...yields) - 0.2;
    const maxY = Math.max(...yields) + 0.2;
    const rangeY = maxY - minY;

    // Grid
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(dims.w - pad.right, y);
      ctx.stroke();

      const val = maxY - (rangeY * i) / 4;
      ctx.fillStyle = "#71717a";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${val.toFixed(2)}%`, pad.left - 4, y + 3);
    }

    // X labels
    ctx.textAlign = "center";
    for (let i = 0; i < curveData.length; i++) {
      const x = pad.left + (chartW * i) / (curveData.length - 1);
      ctx.fillStyle = "#71717a";
      ctx.font = "8px monospace";
      ctx.fillText(curveData[i].maturity, x, dims.h - pad.bottom + 14);
    }

    // Yield curve line
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    for (let i = 0; i < curveData.length; i++) {
      const x = pad.left + (chartW * i) / (curveData.length - 1);
      const y = pad.top + chartH - ((curveData[i].yieldValue - minY) / rangeY) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Data points
    for (let i = 0; i < curveData.length; i++) {
      const x = pad.left + (chartW * i) / (curveData.length - 1);
      const y = pad.top + chartH - ((curveData[i].yieldValue - minY) / rangeY) * chartH;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Value label
      ctx.fillStyle = "#d4d4d8";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${curveData[i].yieldValue.toFixed(2)}%`, x, y - 8);
    }

    // Spread annotation
    const spread2y10y = curveData.find((d) => d.maturity === "2Y");
    const spread10y = curveData.find((d) => d.maturity === "10Y");
    if (spread2y10y && spread10y) {
      const spread = spread10y.yieldValue - spread2y10y.yieldValue;
      ctx.fillStyle = spread >= 0 ? "#22c55e" : "#ef4444";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`2s10s: ${spread >= 0 ? "+" : ""}${spread.toFixed(2)}%`, pad.left + 4, pad.top + 12);
    }

    // Title
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`Date: ${date}`, dims.w - pad.right - 4, pad.top + 12);

  }, [data, dims, date]);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading yield curve...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No yield curve data</div>;

  const dates = [...new Set(data.map((d) => d.date))].sort().reverse();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-zinc-500"
        >
          {dates.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span className="text-[10px] text-zinc-600">US Treasury Yield Curve</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0">
        <canvas ref={canvasRef} style={{ width: dims.w, height: dims.h }} className="block" />
      </div>
    </div>
  );
}
