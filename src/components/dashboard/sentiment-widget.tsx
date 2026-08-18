"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { Panel } from "@/components/ui/panel";

interface SentimentData {
  latest: {
    score: number;
    classification: string;
    timestamp: string;
    source: string;
    assetClass: string;
  };
  history: Array<{
    id: number;
    score: number;
    classification: string;
    timestamp: string;
  }>;
}

export function SentimentWidget() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sentiment")
      .then((r) => r.json())
      .then((res) => {
        if (res.latest) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Panel title="Market Sentiment & Risk Index">
        <div className="h-28 flex items-center justify-center text-xs text-zinc-500">
          Loading sentiment telemetry...
        </div>
      </Panel>
    );
  }

  const score = data?.latest.score ?? 50;
  const classification = data?.latest.classification ?? "Neutral";

  // Color mapping based on Fear & Greed score
  const getBadgeStyle = (val: number) => {
    if (val >= 75) return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: Zap };
    if (val >= 55) return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: TrendingUp };
    if (val >= 45) return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: Activity };
    if (val >= 25) return { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: AlertTriangle };
    return { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", icon: ShieldAlert };
  };

  const style = getBadgeStyle(score);
  const IconComponent = style.icon;

  return (
    <Panel title="Market Sentiment Index (Alternative.me)">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-1">
        {/* Score & Gauge Display */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className={`relative flex items-center justify-center w-16 h-16 rounded-xl border ${style.border} ${style.bg}`}>
            <span className={`font-mono text-2xl font-bold ${style.text}`}>{score}</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <IconComponent className={`w-4 h-4 ${style.text}`} />
              <span className={`text-sm font-medium ${style.text}`}>{classification}</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Crypto Risk & Sentiment Score (0–100)
            </p>
          </div>
        </div>

        {/* Dynamic Visual Progress Bar */}
        <div className="w-full md:w-1/2 space-y-1.5">
          <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
            <span className="text-rose-400">Extreme Fear (0)</span>
            <span className="text-amber-400">Neutral (50)</span>
            <span className="text-emerald-400">Extreme Greed (100)</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                score >= 75
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : score >= 55
                  ? "bg-green-500"
                  : score >= 45
                  ? "bg-amber-500"
                  : score >= 25
                  ? "bg-orange-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}
