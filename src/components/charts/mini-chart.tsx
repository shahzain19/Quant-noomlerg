"use client";

import { useEffect, useRef } from "react";
import type { PricePoint } from "@/types";

function formatVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

export function MiniChart({ data, showVolume = false }: { data: PricePoint[]; showVolume?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 2, right: 2, bottom: showVolume ? 12 : 2, left: 2 };
    const chartH = h - pad.top - pad.bottom;
    const chartW = w - pad.left - pad.right;

    ctx.clearRect(0, 0, w, h);

    const closes = data.map((d) => d.close);
    const minP = Math.min(...closes);
    const maxP = Math.max(...closes);
    const range = maxP - minP || 1;
    const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;
    const xPos = (i: number) => pad.left + i * xStep;
    const yPos = (p: number) => pad.top + (1 - (p - minP) / range) * chartH;

    const positive = closes[0] <= closes[closes.length - 1];
    const color = positive ? "#22c55e" : "#ef4444";

    if (showVolume) {
      const maxVol = Math.max(...data.map((d) => d.volume ?? 0), 1);
      const volTop = pad.top + chartH + 2;
      const volH = h - volTop - pad.bottom;
      for (let i = 0; i < data.length; i++) {
        const vol = data[i].volume ?? 0;
        const barH = (vol / maxVol) * volH;
        const x = xPos(i);
        const barW = Math.max(xStep * 0.5, 1);
        ctx.fillStyle = data[i].close >= data[i].open ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)";
        ctx.fillRect(x - barW / 2, volTop + volH - barH, barW, barH);
      }
    }

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, positive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(xPos(0), pad.top + chartH);
    for (let i = 0; i < data.length; i++) {
      ctx.lineTo(xPos(i), yPos(closes[i]));
    }
    ctx.lineTo(xPos(data.length - 1), pad.top + chartH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = xPos(i);
      const y = yPos(closes[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data, showVolume]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
