"use client";

import { useEffect, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Filing {
  id: number;
  ticker: string;
  type: string;
  title: string;
  description: string | null;
  url: string | null;
  filedAt: string;
}

export function FilingsPanel() {
  const [data, setData] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    fetch("/api/economy?type=filings")
      .then((r) => r.json())
      .then((d: Filing[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading filings...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No filings found</div>;

  const types = [...new Set(data.map((f) => f.type))];
  const filtered = filter === "all" ? data : data.filter((f) => f.type === filter);

  const typeColors: Record<string, string> = {
    "10-K": "bg-blue-500/20 text-blue-400",
    "10-Q": "bg-blue-500/10 text-blue-300",
    "8-K": "bg-amber-500/20 text-amber-400",
    "4": "bg-green-500/20 text-green-400",
    "13F": "bg-purple-500/20 text-purple-400",
    "SC 13D": "bg-red-500/20 text-red-400",
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 px-2 pt-2 pb-1 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-2 py-0.5 text-[9px] rounded border whitespace-nowrap transition-colors",
            filter === "all"
              ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
          )}
        >
          All ({data.length})
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-2 py-0.5 text-[9px] rounded border whitespace-nowrap transition-colors",
              filter === t
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto divide-y divide-zinc-800/50">
        {filtered.slice(0, 40).map((filing) => (
          <div key={filing.id} className="px-2 py-2 hover:bg-zinc-900/30">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <FileText size={12} className="text-zinc-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                    typeColors[filing.type] ?? "bg-zinc-700 text-zinc-400"
                  )}>
                    {filing.type}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{filing.ticker}</span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug line-clamp-2">{filing.title}</p>
                {filing.description && (
                  <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{filing.description}</p>
                )}
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span className="text-[9px] text-zinc-600 font-mono">
                  {new Date(filing.filedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                {filing.url && (
                  <a href={filing.url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-blue-400">
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
