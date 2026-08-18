const SEC_BASE = "https://efts.sec.gov/LATEST";
const SEC_BROWSE = "https://www.sec.gov/cgi-bin/browse-edgar";
const SEC_USER_AGENT = "Mozilla/5.0 (compatible; NoomlDataBot/1.0; contact@example.com)";

interface EftsHit {
  _source: {
    file_date: string;
    display_names: string[];
    entity_name: string;
    form_type: string;
    file_num: string;
    period_of_report: string;
    item_description: string;
  };
  _id: string;
}

interface EftsResponse {
  hits: {
    hits: EftsHit[];
    total: { value: number };
  };
}

interface BrowseEntry {
  type: string;
  description: string;
  company: string;
  cik: string;
  date: string;
  url: string;
}

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

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractTickerFromCompany(company: string): string {
  // Common patterns: "Apple Inc", "Microsoft Corp", etc.
  // The ticker isn't always in the company name from SEC
  // We'll return a sanitized identifier
  return company.replace(/[^a-zA-Z0-9\s]/g, "").trim();
}

export interface SecFiling {
  ticker: string;
  type: string;
  title: string;
  description: string;
  url: string;
  filedAt: string;
}

export interface InsiderTrade {
  ticker: string;
  insiderName: string;
  title: string;
  transactionType: string;
  shares: number;
  price: number;
  filedAt: string;
}

export async function fetchRecentFilings(): Promise<SecFiling[]> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const startDate = thirtyDaysAgo.toISOString().split("T")[0];
    const endDate = now.toISOString().split("T")[0];

    const url = new URL(`${SEC_BASE}/search-index`);
    url.searchParams.set("q", '"*"');
    url.searchParams.set("forms", "10-K,10-Q,8-K,4,13F");
    url.searchParams.set("dateRange", "custom");
    url.searchParams.set("startdt", startDate);
    url.searchParams.set("enddt", endDate);

    const resp = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": SEC_USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      console.error(`[SecEdgar] EFTS search returned ${resp.status} ${resp.statusText}`);
      return [];
    }

    const data: EftsResponse = await resp.json();

    if (!data.hits?.hits) {
      return [];
    }

    return data.hits.hits.map((hit) => {
      const source = hit._source;
      const company = source.entity_name || (source.display_names?.[0] ?? "Unknown");
      const ticker = extractTickerFromCompany(company);
      const formType = source.form_type || "Unknown";

      return {
        ticker,
        type: formType,
        title: `${company} - Form ${formType}`,
        description: source.item_description || `SEC filing: ${formType}`,
        url: `https://www.sec.gov/Archives/edgar/data/${hit._id}`,
        filedAt: source.file_date || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("[SecEdgar] Error fetching recent filings:", err);
    return [];
  }
}

export async function fetchInsiderTransactions(): Promise<InsiderTrade[]> {
  const trades: InsiderTrade[] = [];

  try {
    // Fetch Form 4 filings from EFTS
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const startDate = ninetyDaysAgo.toISOString().split("T")[0];
    const endDate = now.toISOString().split("T")[0];

    const url = new URL(`${SEC_BASE}/search-index`);
    url.searchParams.set("q", '"*"[form-type:"4"]');
    url.searchParams.set("forms", "4");
    url.searchParams.set("dateRange", "custom");
    url.searchParams.set("startdt", startDate);
    url.searchParams.set("enddt", endDate);

    const resp = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": SEC_USER_AGENT,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      console.error(`[SecEdgar] Form 4 search returned ${resp.status} ${resp.statusText}`);
      return [];
    }

    const data: EftsResponse = await resp.json();

    if (!data.hits?.hits) {
      return [];
    }

    for (const hit of data.hits.hits.slice(0, 50)) {
      const source = hit._source;
      const company = source.entity_name || (source.display_names?.[0] ?? "Unknown");
      const ticker = extractTickerFromCompany(company);

      trades.push({
        ticker,
        insiderName: "N/A",
        title: `Form 4 - ${company}`,
        transactionType: "Purchase/Sale",
        shares: 0,
        price: 0,
        filedAt: source.file_date || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("[SecEdgar] Error fetching insider transactions:", err);
  }

  return trades;
}
