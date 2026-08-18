"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { formatTimestamp } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  publishedAt: string;
  relatedSymbol: string | null;
  companyName: string | null;
}

export function NewsContent() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news?limit=50")
      .then((r) => r.json())
      .then((data: NewsItem[]) => setNews(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-100">News</h1>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <Panel className="border-zinc-800">
          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">Loading news…</div>
          ) : news.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">No news available.</div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {news.map((item) => (
                <article key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-zinc-100 leading-snug">
                        {item.title}
                      </h3>
                      {item.summary && (
                        <p className="mt-1 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        {item.relatedSymbol && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                            {item.relatedSymbol}
                          </span>
                        )}
                        {item.source && (
                          <span className="text-[10px] text-zinc-500">{item.source}</span>
                        )}
                        <span className="text-[10px] text-zinc-600">
                          {formatTimestamp(item.publishedAt)}
                        </span>
                      </div>
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors mt-0.5"
                        title="Open original article"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
