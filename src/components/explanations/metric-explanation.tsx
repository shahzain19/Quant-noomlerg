"use client";

import { getMetricExplanation } from "@/lib/explanations/metrics";
import { cn } from "@/lib/utils";
import { useExplorerMode } from "@/components/providers/app-provider";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MetricExplanation({
  metricKey,
  value,
  className,
}: {
  metricKey: string;
  value: React.ReactNode;
  className?: string;
}) {
  const explorer = useExplorerMode();
  const explanation = getMetricExplanation(metricKey);
  const [expanded, setExpanded] = useState(false);

  if (!explanation) {
    return (
      <div className={className}>
        <div className="flex justify-between">
          <span className="text-zinc-500">{metricKey}</span>
          <span className="font-mono">{value}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-b border-zinc-800/50 py-2", className)}>
      <div className="flex justify-between items-baseline">
        <span className="text-zinc-400 text-sm">{explanation.label}</span>
        <span className="font-mono text-zinc-100">{value}</span>
      </div>
      {explorer && (
        <div className="mt-1.5">
          <p className="text-xs text-zinc-500 leading-relaxed">{explanation.plainEnglish}</p>
          {expanded && (
            <p className="text-xs text-zinc-600 mt-1 italic">{explanation.caveman}</p>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-0.5"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Less" : "Learn more"}
          </button>
        </div>
      )}
    </div>
  );
}
