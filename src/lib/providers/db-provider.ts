import { eq, and, gte, lte, desc, asc, sql, like, or, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type {
  MarketDataProvider,
  Quote,
  PricePoint,
  CompanyDetail,
  FinancialStatement,
  ChartRange,
  PeriodType,
} from "@/types";
import { getChartRangeDates, downsamplePrices } from "@/lib/utils";
import { changePercent } from "@/lib/calculations";

export class DbMarketDataProvider implements MarketDataProvider {
  async getQuote(symbol: string): Promise<Quote | null> {
    const db = getDb();
    const security = await db.query.securities.findFirst({
      where: eq(schema.securities.symbol, symbol.toUpperCase()),
    });
    if (!security) return null;

    const latestPrices = await db
      .select()
      .from(schema.prices)
      .where(eq(schema.prices.securityId, security.id))
      .orderBy(desc(schema.prices.timestamp))
      .limit(2);

    const latest = latestPrices[0];
    const previous = latestPrices[1];

    if (!latest) {
      return {
        symbol: security.symbol,
        name: security.name,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        timestamp: null,
        assetType: security.assetType as Quote["assetType"],
      };
    }

    const change = previous ? latest.close - previous.close : null;
    const changePct = previous ? changePercent(latest.close, previous.close) : null;

    return {
      symbol: security.symbol,
      name: security.name,
      price: latest.close,
      change,
      changePercent: changePct,
      volume: latest.volume,
      timestamp: latest.timestamp,
      assetType: security.assetType as Quote["assetType"],
    };
  }

  async getHistoricalPrices(symbol: string, range: ChartRange): Promise<PricePoint[]> {
    const db = getDb();
    const security = await db.query.securities.findFirst({
      where: eq(schema.securities.symbol, symbol.toUpperCase()),
    });
    if (!security) return [];

    const { from, to } = getChartRangeDates(range);
    const rows = await db
      .select()
      .from(schema.prices)
      .where(
        and(
          eq(schema.prices.securityId, security.id),
          gte(schema.prices.timestamp, from.toISOString()),
          lte(schema.prices.timestamp, to.toISOString())
        )
      )
      .orderBy(asc(schema.prices.timestamp));

    const points = rows.map((r) => ({
      timestamp: r.timestamp,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
    }));

    return downsamplePrices(points);
  }

  async getCompany(symbol: string): Promise<CompanyDetail | null> {
    const db = getDb();
    const security = await db.query.securities.findFirst({
      where: eq(schema.securities.symbol, symbol.toUpperCase()),
    });
    if (!security) return null;

    let company = null;
    if (security.companyId) {
      company = await db.query.companies.findFirst({
        where: eq(schema.companies.id, security.companyId),
      });
    }

    const quote = await this.getQuote(symbol);

    return {
      id: company?.id ?? security.id,
      name: company?.name ?? security.name,
      ticker: company?.ticker ?? security.symbol,
      exchange: company?.exchange ?? security.exchange ?? "—",
      sector: company?.sector ?? null,
      industry: company?.industry ?? null,
      country: company?.country ?? null,
      description: company?.description ?? null,
      website: company?.website ?? null,
      quote,
      marketCap: security.marketCap,
      peRatio: security.peRatio,
      eps: security.eps,
      revenue: security.revenue,
      netMargin: security.netMargin,
      revenueGrowth: security.revenueGrowth,
      dividendYield: security.dividendYield,
      debt: security.debt,
      beta: security.beta,
      priceToSales: security.priceToSales,
      priceToBook: security.priceToBook,
      evToEbitda: security.evToEbitda,
      high52w: security.high52w,
      low52w: security.low52w,
      dataTimestamp: quote?.timestamp ?? null,
    };
  }

  async getFinancials(symbol: string, periodType: PeriodType = "annual"): Promise<FinancialStatement[]> {
    const db = getDb();
    const security = await db.query.securities.findFirst({
      where: eq(schema.securities.symbol, symbol.toUpperCase()),
    });
    if (!security?.companyId) return [];

    const rows = await db
      .select()
      .from(schema.financialStatements)
      .where(
        and(
          eq(schema.financialStatements.companyId, security.companyId),
          eq(schema.financialStatements.periodType, periodType)
        )
      )
      .orderBy(desc(schema.financialStatements.period));

    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      period: r.period,
      periodType: r.periodType as PeriodType,
      revenue: r.revenue,
      costOfRevenue: r.costOfRevenue,
      grossProfit: r.grossProfit,
      operatingIncome: r.operatingIncome,
      netIncome: r.netIncome,
      eps: r.eps,
      assets: r.assets,
      liabilities: r.liabilities,
      equity: r.equity,
      cash: r.cash,
      debt: r.debt,
      operatingCashFlow: r.operatingCashFlow,
      capex: r.capex,
      freeCashFlow: r.freeCashFlow,
    }));
  }
}

export const marketDataProvider = new DbMarketDataProvider();

export async function getMarketsOverview() {
  const db = getDb();
  const indices = await db
    .select()
    .from(schema.securities)
    .where(eq(schema.securities.assetType, "index"));

  const results = [];
  for (const idx of indices) {
    const quote = await marketDataProvider.getQuote(idx.symbol);
    results.push({ ...idx, quote });
  }
  return results;
}

export async function getSecuritiesByType(assetType: string) {
  const db = getDb();
  const secs = await db
    .select()
    .from(schema.securities)
    .where(eq(schema.securities.assetType, assetType));

  const results = [];
  for (const sec of secs) {
    const quote = await marketDataProvider.getQuote(sec.symbol);
    results.push({ ...sec, quote });
  }
  return results;
}

export async function getTopMovers(limit = 5) {
  const db = getDb();
  const equities = await db
    .select()
    .from(schema.securities)
    .where(eq(schema.securities.assetType, "equity"))
    .limit(20);

  const withQuotes = [];
  for (const eq_ of equities) {
    const quote = await marketDataProvider.getQuote(eq_.symbol);
    if (quote?.changePercent != null) {
      withQuotes.push({ ...eq_, quote });
    }
  }

  return withQuotes
    .sort((a, b) => Math.abs(b.quote!.changePercent!) - Math.abs(a.quote!.changePercent!))
    .slice(0, limit);
}

export { eq, and, gte, lte, desc, asc, sql, like, or, isNotNull };
