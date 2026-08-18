"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  publishedAt: string;
  relatedSymbol: string | null;
}

export function NewsPanel() {
  const [data, setData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news?limit=20")
      .then((r) => r.json())
      .then((d: NewsItem[]) => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Loading...</div>;
  }

  if (!data.length) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-xs">No news</div>;
  }

  return (
    <div className="h-full overflow-auto divide-y divide-zinc-800/50">
      {data.map((item) => (
        <div key={item.id} className="px-2 py-2 hover:bg-zinc-900/30">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-zinc-200 hover:text-blue-400 line-clamp-2 leading-snug"
                >
                  {item.title}
                </a>
              ) : (
                <p className="text-[12px] text-zinc-200 line-clamp-2 leading-snug">{item.title}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {item.relatedSymbol && (
                  <span className="text-[9px] font-mono text-zinc-500 bg-zinc-800 px-1 rounded">
                    {item.relatedSymbol}
                  </span>
                )}
                {item.source && <span className="text-[10px] text-zinc-600">{item.source}</span>}
                <span className="text-[10px] text-zinc-600">
                  {new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 shrink-0">
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
