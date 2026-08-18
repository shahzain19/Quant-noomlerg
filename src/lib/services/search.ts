import { eq, like, or, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { SearchResult } from "@/types";

export async function searchAll(query: string, limit = 20): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const db = getDb();
  const q = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  const companies = await db
    .select()
    .from(schema.companies)
    .where(or(like(schema.companies.name, q), like(schema.companies.ticker, q)))
    .limit(limit);

  for (const c of companies) {
    results.push({
      id: `company-${c.id}`,
      type: "company",
      symbol: c.ticker,
      name: c.name,
      subtitle: c.exchange,
      href: `/companies/${c.ticker}`,
    });
  }

  const securities = await db
    .select()
    .from(schema.securities)
    .where(or(like(schema.securities.symbol, q), like(schema.securities.name, q)))
    .limit(limit);

  for (const s of securities) {
    if (results.some((r) => r.symbol === s.symbol)) continue;

    let type: SearchResult["type"] = "market";
    if (s.assetType === "currency") type = "currency";
    else if (s.assetType === "commodity") type = "commodity";
    else if (s.assetType === "crypto") type = "crypto";
    else if (s.assetType === "equity") type = "company";

    const href =
      s.assetType === "equity"
        ? `/companies/${s.symbol}`
        : `/markets/${s.assetType}/${encodeURIComponent(s.symbol)}`;

    results.push({
      id: `security-${s.id}`,
      type,
      symbol: s.symbol,
      name: s.name,
      subtitle: s.exchange ?? s.assetType,
      href,
    });
  }

  return results.slice(0, limit);
}

export async function getRecentNews(limit = 10) {
  const db = getDb();
  return db
    .select({
      id: schema.news.id,
      title: schema.news.title,
      summary: schema.news.summary,
      source: schema.news.source,
      url: schema.news.url,
      publishedAt: schema.news.publishedAt,
      relatedSymbol: schema.news.relatedSymbol,
      companyName: schema.companies.name,
    })
    .from(schema.news)
    .leftJoin(schema.companies, eq(schema.news.relatedCompanyId, schema.companies.id))
    .orderBy(desc(schema.news.publishedAt))
    .limit(limit);
}

export async function getNewsForCompany(companyId: number, limit = 10) {
  const db = getDb();
  return db
    .select()
    .from(schema.news)
    .where(eq(schema.news.relatedCompanyId, companyId))
    .orderBy(desc(schema.news.publishedAt))
    .limit(limit);
}

export async function getEventsForCompany(companyId: number, limit = 10) {
  const db = getDb();
  return db
    .select()
    .from(schema.events)
    .where(eq(schema.events.companyId, companyId))
    .orderBy(desc(schema.events.date))
    .limit(limit);
}

export async function getAllNews(limit = 50, offset = 0) {
  const db = getDb();
  return db
    .select({
      id: schema.news.id,
      title: schema.news.title,
      summary: schema.news.summary,
      source: schema.news.source,
      url: schema.news.url,
      publishedAt: schema.news.publishedAt,
      relatedSymbol: schema.news.relatedSymbol,
      companyName: schema.companies.name,
    })
    .from(schema.news)
    .leftJoin(schema.companies, eq(schema.news.relatedCompanyId, schema.companies.id))
    .orderBy(desc(schema.news.publishedAt))
    .limit(limit)
    .offset(offset);
}
