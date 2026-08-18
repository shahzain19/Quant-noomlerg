"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MacroEvent {
  id: number;
  type: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  importance: string | null;
  source: string | null;
}

export function MacroCalendarPanel() {
  const [data, setData] = useState<MacroEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    fetch("/api/economy?type=macro_calendar")
      .then((r) => r.json())
      .then((d: MacroEvent[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading calendar...</div>;

  const now = new Date().toISOString().split("T")[0];
  const upcoming = data.filter((e) => e.date >= now);
  const filtered = filter === "all" ? upcoming : upcoming.filter((e) => e.type === filter);

  const typeColors: Record<string, string> = {
    fed_meeting: "bg-amber-500/20 text-amber-400",
    fomc_minutes: "bg-amber-500/10 text-amber-300",
    cpi_release: "bg-red-500/20 text-red-400",
    jobs_report: "bg-green-500/20 text-green-400",
    gdp_release: "bg-blue-500/20 text-blue-400",
    pce_release: "bg-purple-500/20 text-purple-400",
    earnings_season: "bg-orange-500/20 text-orange-400",
  };

  const typeIcons: Record<string, typeof Calendar> = {
    fed_meeting: AlertTriangle,
    cpi_release: AlertTriangle,
    jobs_report: Info,
    gdp_release: Info,
    pce_release: Info,
    fomc_minutes: Clock,
    earnings_season: Calendar,
  };

  const types = [...new Set(upcoming.map((e) => e.type))];

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
          All
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
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto divide-y divide-zinc-800/50">
        {filtered.slice(0, 50).map((ev) => {
          const Icon = typeIcons[ev.type] ?? Calendar;
          const daysUntil = Math.ceil((new Date(ev.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isToday = ev.date === now;
          const isThisWeek = daysUntil >= 0 && daysUntil <= 7;

          return (
            <div key={ev.id} className={cn("px-2 py-2 hover:bg-zinc-900/30", isToday && "bg-blue-500/5")}>
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <Icon size={12} className={cn(
                    isToday ? "text-blue-400" : isThisWeek ? "text-amber-400" : "text-zinc-600"
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                      typeColors[ev.type] ?? "bg-zinc-700 text-zinc-400"
                    )}>
                      {ev.type.replace(/_/g, " ")}
                    </span>
                    {ev.importance === "high" && (
                      <span className="text-[8px] text-red-400 font-bold">HIGH</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">{ev.title}</p>
                  {ev.description && (
                    <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{ev.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {ev.time && (
                    <span className="text-[9px] text-zinc-600 block">{ev.time}</span>
                  )}
                  <span className={cn(
                    "text-[8px] font-mono block mt-0.5",
                    isToday ? "text-blue-400" : isThisWeek ? "text-amber-400" : "text-zinc-600"
                  )}>
                    {daysUntil === 0 ? "TODAY" : daysUntil === 1 ? "TOMORROW" : daysUntil > 0 ? `in ${daysUntil}d` : `${Math.abs(daysUntil)}d ago`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-xs">No upcoming events</div>
        )}
      </div>
    </div>
  );
}
