"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

interface Event {
  id: number;
  type: string;
  title: string;
  description: string | null;
  date: string;
  companyName: string | null;
  ticker: string | null;
}

export function EarningsPanel() {
  const [data, setData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then(async (companies: any[]) => {
        const allEvents: Event[] = [];
        for (const c of companies.slice(0, 20)) {
          try {
            const res = await fetch(`/api/companies/${c.ticker}`);
            const detail = await res.json();
            if (detail.events?.length) {
              for (const ev of detail.events) {
                allEvents.push({
                  ...ev,
                  companyName: c.name,
                  ticker: c.ticker,
                });
              }
            }
          } catch {}
        }
        allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(allEvents);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading events...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No events found</div>;

  const typeColors: Record<string, string> = {
    earnings: "bg-amber-500/20 text-amber-400",
    dividend: "bg-green-500/20 text-green-400",
    split: "bg-blue-500/20 text-blue-400",
    announcement: "bg-purple-500/20 text-purple-400",
    default: "bg-zinc-700 text-zinc-400",
  };

  return (
    <div className="h-full overflow-auto divide-y divide-zinc-800/50">
      {data.map((ev) => (
        <div key={ev.id} className="px-2 py-2 hover:bg-zinc-900/30">
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              <Calendar size={12} className="text-zinc-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${typeColors[ev.type] ?? typeColors.default}`}>
                  {ev.type}
                </span>
                {ev.ticker && (
                  <Link href={`/companies/${ev.ticker}`} className="text-[10px] font-mono text-zinc-400 hover:text-blue-400">
                    {ev.ticker}
                  </Link>
                )}
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">{ev.title}</p>
              {ev.description && (
                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{ev.description}</p>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 font-mono shrink-0">
              {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
