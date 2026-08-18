import type { NormalizedNews, DataProvider } from "./types";

const RSS_FEEDS = [
  {
    name: "Reuters Business",
    url: "http://feeds.reuters.com/reuters/businessNews",
    source: "Reuters",
  },
  {
    name: "Reuters Markets",
    url: "http://feeds.reuters.com/reuters/marketsNews",
    source: "Reuters",
  },
  {
    name: "CNBC Top News",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    source: "CNBC",
  },
  {
    name: "CNBC World",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362",
    source: "CNBC",
  },
  {
    name: "MarketWatch",
    url: "http://feeds.marketwatch.com/marketwatch/topstories/",
    source: "MarketWatch",
  },
  {
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/news/rssindex",
    source: "Yahoo Finance",
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTags(xml: string, tag: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g");
  let match = regex.exec(xml);
  while (match !== null) {
    results.push(match[1].trim());
    match = regex.exec(xml);
  }
  return results;
}

function extractCData(text: string): string {
  const cdataRegex = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
  return text.replace(cdataRegex, "$1").trim();
}

function extractTickerSymbols(text: string): string[] {
  const tickers: string[] = [];
  const patterns = [
    /\$([A-Z]{1,5})\b/g,
    /\b([A-Z]{1,5})\s+(?:shares|stock|stock price|earnings|revenue|profit|loss|CEO|CFO|acquires|buys|sells)/gi,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(text);
    while (match !== null) {
      const ticker = match[1].toUpperCase();
      if (!tickers.includes(ticker) && ticker.length >= 2) {
        tickers.push(ticker);
      }
      match = pattern.exec(text);
    }
  }

  return tickers;
}

function parseRssItems(xml: string, source: string): NormalizedNews[] {
  const items: NormalizedNews[] = [];

  // Handle both RSS 2.0 (<item>) and Atom (<entry>)
  const isAtom = xml.includes("<feed") && xml.includes("<entry");
  const itemTag = isAtom ? "entry" : "item";

  const itemBlocks = extractTags(xml, itemTag);

  for (const block of itemBlocks) {
    let title = "";
    let summary = "";
    let url = "";
    let publishedAt = "";

    if (isAtom) {
      // Atom format
      const titleTags = extractTags(block, "title");
      const summaryTags = extractTags(block, "summary");
      const contentTags = extractTags(block, "content");
      const linkMatch = block.match(/<link[^>]*href="([^"]+)"/);
      const updatedTags = extractTags(block, "updated");
      const publishedTags = extractTags(block, "published");

      title = titleTags.length > 0 ? extractCData(titleTags[0]) : "";
      summary = summaryTags.length > 0
        ? extractCData(summaryTags[0])
        : contentTags.length > 0
          ? extractCData(contentTags[0])
          : "";
      url = linkMatch ? linkMatch[1] : "";
      publishedAt = publishedTags.length > 0
        ? publishedTags[0]
        : updatedTags.length > 0
          ? updatedTags[0]
          : new Date().toISOString();
    } else {
      // RSS 2.0 format
      const titleTags = extractTags(block, "title");
      const descTags = extractTags(block, "description");
      const linkTags = extractTags(block, "link");
      const pubDateTags = extractTags(block, "pubDate");

      title = titleTags.length > 0 ? extractCData(titleTags[0]) : "";
      summary = descTags.length > 0 ? extractCData(descTags[0]) : "";
      url = linkTags.length > 0 ? extractCData(linkTags[0]).replace(/<[^>]+>/g, "").trim() : "";
      publishedAt = pubDateTags.length > 0 ? pubDateTags[0] : new Date().toISOString();
    }

    if (!title) continue;

    // Clean HTML from summary
    summary = summary
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .trim();

    const combinedText = `${title} ${summary}`;
    const relatedSymbols = extractTickerSymbols(combinedText);

    items.push({
      title,
      summary: summary.substring(0, 500),
      source,
      url,
      publishedAt,
      relatedSymbol: relatedSymbols.length > 0 ? relatedSymbols[0] : null,
    });
  }

  return items;
}

async function fetchFeed(feed: { name: string; url: string; source: string }): Promise<NormalizedNews[]> {
  try {
    const resp = await fetch(feed.url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml",
        "User-Agent": "Mozilla/5.0 (compatible; NoomlDataBot/1.0)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      console.error(`[RssNews] ${feed.name} returned ${resp.status} ${resp.statusText}`);
      return [];
    }

    const xml = await resp.text();
    return parseRssItems(xml, feed.source);
  } catch (err) {
    console.error(`[RssNews] Error fetching ${feed.name}:`, err);
    return [];
  }
}

export class RssNewsProvider implements DataProvider {
  name = "rss-news";

  async fetchNews(): Promise<NormalizedNews[]> {
    const allNews: NormalizedNews[] = [];

    for (let i = 0; i < RSS_FEEDS.length; i++) {
      const items = await fetchFeed(RSS_FEEDS[i]);
      allNews.push(...items);

      if (i < RSS_FEEDS.length - 1) {
        await sleep(300);
      }
    }

    // Deduplicate by title
    const seen = new Set<string>();
    const unique: NormalizedNews[] = [];
    for (const item of allNews) {
      const key = item.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    // Sort by published date, newest first
    unique.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    return unique;
  }
}

export async function fetchRssNews(): Promise<NormalizedNews[]> {
  const provider = new RssNewsProvider();
  return provider.fetchNews();
}

