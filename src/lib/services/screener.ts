import { eq, and, gte, lte, desc, asc, sql, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { marketDataProvider } from "@/lib/providers/db-provider";
import type { ScreenerFilter, ScreenerResult } from "@/types";

export async function runScreener(
  filters: ScreenerFilter,
  sortBy = "marketCap",
  sortDir: "asc" | "desc" = "desc",
  limit = 50,
  offset = 0
): Promise<{ results: ScreenerResult[]; total: number }> {
  const db = getDb();

  const conditions = [eq(schema.securities.assetType, "equity")];

  if (filters.minMarketCap != null) conditions.push(gte(schema.securities.marketCap, filters.minMarketCap));
  if (filters.maxMarketCap != null) conditions.push(lte(schema.securities.marketCap, filters.maxMarketCap));
  if (filters.minPe != null) conditions.push(gte(schema.securities.peRatio, filters.minPe));
  if (filters.maxPe != null) conditions.push(lte(schema.securities.peRatio, filters.maxPe));
  if (filters.minRevenueGrowth != null)
    conditions.push(gte(schema.securities.revenueGrowth, filters.minRevenueGrowth));
  if (filters.minProfitMargin != null)
    conditions.push(gte(schema.securities.netMargin, filters.minProfitMargin));
  if (filters.maxDebt != null) conditions.push(lte(schema.securities.debt, filters.maxDebt));
  if (filters.minDividendYield != null)
    conditions.push(gte(schema.securities.dividendYield, filters.minDividendYield));
  if (filters.sector) conditions.push(eq(schema.companies.sector, filters.sector));
  if (filters.country) conditions.push(eq(schema.companies.country, filters.country));
  if (filters.exchange) conditions.push(eq(schema.companies.exchange, filters.exchange));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortColumnMap: Record<string, any> = {
    marketCap: schema.securities.marketCap,
    peRatio: schema.securities.peRatio,
    revenueGrowth: schema.securities.revenueGrowth,
    netMargin: schema.securities.netMargin,
    dividendYield: schema.securities.dividendYield,
    debt: schema.securities.debt,
    symbol: schema.securities.symbol,
  };

  const sortCol = sortColumnMap[sortBy] ?? schema.securities.marketCap;
  const orderFn = sortDir === "asc" ? asc : desc;

  const rows = await db
    .select({
      symbol: schema.securities.symbol,
      name: schema.securities.name,
      sector: schema.companies.sector,
      exchange: schema.companies.exchange,
      marketCap: schema.securities.marketCap,
      peRatio: schema.securities.peRatio,
      revenueGrowth: schema.securities.revenueGrowth,
      netMargin: schema.securities.netMargin,
      dividendYield: schema.securities.dividendYield,
      debt: schema.securities.debt,
    })
    .from(schema.securities)
    .leftJoin(schema.companies, eq(schema.securities.companyId, schema.companies.id))
    .where(and(...conditions))
    .orderBy(orderFn(sortCol))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.securities)
    .leftJoin(schema.companies, eq(schema.securities.companyId, schema.companies.id))
    .where(and(...conditions));

  const results: ScreenerResult[] = [];
  for (const row of rows) {
    const quote = await marketDataProvider.getQuote(row.symbol);
    const price = quote?.price ?? null;

    if (filters.minPrice != null && price != null && price < filters.minPrice) continue;
    if (filters.maxPrice != null && price != null && price > filters.maxPrice) continue;

    results.push({
      symbol: row.symbol,
      name: row.name,
      sector: row.sector,
      exchange: row.exchange,
      price,
      marketCap: row.marketCap,
      peRatio: row.peRatio,
      revenueGrowth: row.revenueGrowth,
      netMargin: row.netMargin,
      dividendYield: row.dividendYield,
      debt: row.debt,
    });
  }

  return { results, total: countResult[0]?.count ?? 0 };
}

export async function getScreenerFacets() {
  const db = getDb();
  const sectors = await db
    .selectDistinct({ sector: schema.companies.sector })
    .from(schema.companies)
    .where(isNotNull(schema.companies.sector));
  const exchanges = await db
    .selectDistinct({ exchange: schema.companies.exchange })
    .from(schema.companies)
    .where(isNotNull(schema.companies.exchange));
  return {
    sectors: sectors.map((s) => s.sector).filter(Boolean) as string[],
    exchanges: exchanges.map((e) => e.exchange).filter(Boolean) as string[],
  };
}
