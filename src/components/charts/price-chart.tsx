"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { PricePoint } from "@/types";
import { formatTimestamp } from "@/lib/utils";
import { NoData } from "@/components/ui/panel";

export function PriceChart({ data, symbol }: { data: PricePoint[]; symbol: string }) {
  if (!data.length) return <NoData message="No chart data available" />;

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const first = data[0]?.close ?? 0;
  const last = data[data.length - 1]?.close ?? 0;
  const positive = last >= first;
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={{ stroke: "#27272a" }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={55}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 4,
            fontSize: 12,
          }}
          labelFormatter={(_, payload) => {
            const ts = payload?.[0]?.payload?.timestamp;
            return ts ? formatTimestamp(ts) : "";
          }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Close"]}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#gradient-${symbol})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniSparkline({ data }: { data: PricePoint[] }) {
  if (!data.length) return null;
  const chartData = data.slice(-30).map((d) => ({ close: d.close }));
  const first = chartData[0]?.close ?? 0;
  const last = chartData[chartData.length - 1]?.close ?? 0;
  const color = last >= first ? "#22c55e" : "#ef4444";

  return (
    <ResponsiveContainer width={60} height={24}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="close" stroke={color} strokeWidth={1} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
