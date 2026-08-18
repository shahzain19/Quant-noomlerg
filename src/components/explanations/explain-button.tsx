"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface ExplainButtonProps {
  context: Record<string, unknown>;
  className?: string;
}

export function ExplainButton({ context, className }: ExplainButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; body: string; suggestions?: string[] } | null>(null);

  async function handleExplain() {
    setLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleExplain}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
      >
        <Sparkles size={12} />
        {loading ? "Analyzing..." : "Explain this"}
      </button>
      {result && (
        <div className="mt-3 p-3 bg-zinc-900 border border-zinc-800 rounded text-sm">
          <h4 className="font-medium text-zinc-200 mb-1">{result.title}</h4>
          <p className="text-zinc-400 leading-relaxed">{result.body}</p>
          {result.suggestions && (
            <ul className="mt-2 text-xs text-zinc-500 list-disc list-inside">
              {result.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
