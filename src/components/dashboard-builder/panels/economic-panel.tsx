"use client";

import { useEffect, useState } from "react";

interface Indicator {
  name: string;
  category: string;
  unit: string | null;
  value: number;
  timestamp: string;
}

export function EconomicPanel() {
  const [data, setData] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/economy")
      .then((r) => r.json())
      .then((d: { latest: Indicator }[]) => setData(d.map((i) => i.latest)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;

  function fmt(v: number, unit: string | null): string {
    if (unit === "%") return `${v.toFixed(1)}%`;
    if (unit === "USD") return `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            <th className="text-left py-1.5 px-2 font-medium">Indicator</th>
            <th className="text-right py-1.5 px-2 font-medium">Value</th>
            <th className="text-right py-1.5 px-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ind) => (
            <tr key={ind.name} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
              <td className="py-1.5 px-2 text-zinc-300">{ind.name}</td>
              <td className="py-1.5 px-2 text-right font-mono text-zinc-200">{fmt(ind.value, ind.unit)}</td>
              <td className="py-1.5 px-2 text-right text-zinc-500">
                {new Date(ind.timestamp).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
