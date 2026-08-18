import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nowISO } from "@/lib/utils";
import yahooFinanceDefault from "yahoo-finance2";
import { EXPANDED_TICKERS, SP500_TICKERS, ETF_TICKERS, INTERNATIONAL_TICKERS } from "./tickers";
import { fetchRssNews } from "@/lib/providers/adapters/rss-news";
import { fetchRecentFilings, fetchInsiderTransactions } from "@/lib/providers/adapters/sec-edgar";
import { fetchYieldCurve } from "@/lib/providers/adapters/yield-curve";
import { generateMacroCalendar } from "@/lib/providers/adapters/macro-calendar";
import { fetchWorldBankIndicators } from "@/lib/providers/adapters/world-bank";
import { fetchMarketSentiment } from "@/lib/providers/adapters/sentiment-index";


const yahooFinance = new yahooFinanceDefault({ suppressNotices: ["yahooSurvey"] });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_TICKERS = SP500_TICKERS.slice(0, 100); // Top 100 S&P by default

export interface SyncResult {
  success: boolean;
  source: string;
  recordsSynced: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

function getDataSource(name: string) {
  const db = getDb();
  return db.query.dataSources.findFirst({ where: eq(schema.dataSources.name, name) });
}

async function updateDataSource(name: string, type: string, count: number) {
  const db = getDb();
  const existing = await getDataSource(name);
  const ts = nowISO();
  if (existing) {
    await db
      .update(schema.dataSources)
      .set({ lastImportAt: ts, recordsImported: (existing.recordsImported ?? 0) + count })
      .where(eq(schema.dataSources.id, existing.id));
  } else {
    await db.insert(schema.dataSources).values({
      name,
      type,
      lastImportAt: ts,
      recordsImported: count,
      recordsRejected: 0,
    });
  }
}

async function fetchYahooProfile(symbol: string): Promise<Record<string, unknown> | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [quoteResult, summaryResult]: any[] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile", "defaultKeyStatistics", "financialData"],
      }),
    ]);
    const ap = summaryResult.assetProfile ?? {};
    const ks = summaryResult.defaultKeyStatistics ?? {};
    const fd = summaryResult.financialData ?? {};
    return {
      symbol,
      name: quoteResult.longName ?? quoteResult.shortName ?? symbol,
      sector: ap.sector ?? null,
      industry: ap.industry ?? null,
      description: ap.longBusinessSummary ?? null,
      website: ap.website ?? null,
      marketCap: ks.marketCap?.raw ?? null,
      peRatio: ks.forwardPE?.raw ?? ks.trailingPE?.raw ?? null,
      eps: ks.trailingEps?.raw ?? null,
      revenue: fd.totalRevenue?.raw ?? null,
      netMargin: fd.profitMargins?.raw ?? null,
      debt: fd.totalDebt?.raw ?? null,
      beta: ks.beta?.raw ?? null,
      sharesOutstanding: ks.sharesOutstanding?.raw ?? null,
    };
  } catch {
    return null;
  }
}

export async function syncCompanies(tickers?: string[]): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  const symbols = tickers && tickers.length > 0 ? tickers.map((t) => t.toUpperCase()) : DEFAULT_TICKERS;
  let synced = 0;
  const errors: string[] = [];

  for (const ticker of symbols) {
    try {
      const profile = await fetchYahooProfile(ticker);
      const ts = nowISO();

      const existing = await db.query.companies.findFirst({
        where: eq(schema.companies.ticker, ticker),
      });

      if (existing) {
        await db
          .update(schema.companies)
          .set({
            name: (profile?.name as string) ?? existing.name,
            sector: (profile?.sector as string) ?? existing.sector,
            industry: (profile?.industry as string) ?? existing.industry,
            description: (profile?.description as string) ?? existing.description,
            website: (profile?.website as string) ?? existing.website,
            updatedAt: ts,
          })
          .where(eq(schema.companies.id, existing.id));
      } else {
        await db.insert(schema.companies).values({
          name: profile?.name as string ?? ticker,
          ticker,
          exchange: "NASDAQ",
          sector: (profile?.sector as string) ?? null,
          industry: (profile?.industry as string) ?? null,
          country: "US",
          description: (profile?.description as string) ?? null,
          website: (profile?.website as string) ?? null,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      const company = await db.query.companies.findFirst({ where: eq(schema.companies.ticker, ticker) });
      if (company) {
        const existingSec = await db.query.securities.findFirst({
          where: eq(schema.securities.symbol, ticker),
        });

        if (existingSec) {
          await db
            .update(schema.securities)
            .set({
              name: (profile?.name as string) ?? ticker,
              marketCap: (profile?.marketCap as number) ?? existingSec.marketCap,
              peRatio: (profile?.peRatio as number) ?? existingSec.peRatio,
              eps: (profile?.eps as number) ?? existingSec.eps,
              revenue: (profile?.revenue as number) ?? existingSec.revenue,
              netMargin: (profile?.netMargin as number) ?? existingSec.netMargin,
              debt: (profile?.debt as number) ?? existingSec.debt,
              beta: (profile?.beta as number) ?? existingSec.beta,
              sharesOutstanding: (profile?.sharesOutstanding as number) ?? existingSec.sharesOutstanding,
              updatedAt: ts,
            })
            .where(eq(schema.securities.id, existingSec.id));
        } else {
          await db.insert(schema.securities).values({
            companyId: company.id,
            symbol: ticker,
            name: (profile?.name as string) ?? ticker,
            assetType: "equity",
            currency: "USD",
            exchange: "NASDAQ",
            marketCap: (profile?.marketCap as number) ?? null,
            peRatio: (profile?.peRatio as number) ?? null,
            eps: (profile?.eps as number) ?? null,
            revenue: (profile?.revenue as number) ?? null,
            netMargin: (profile?.netMargin as number) ?? null,
            debt: (profile?.debt as number) ?? null,
            beta: (profile?.beta as number) ?? null,
            sharesOutstanding: (profile?.sharesOutstanding as number) ?? null,
            createdAt: ts,
            updatedAt: ts,
          });
        }
      }
      synced++;
      await sleep(300);
    } catch (e) {
      errors.push(`Failed to sync ${ticker}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  await updateDataSource("Yahoo Finance", "companies", synced);

  return {
    success: errors.length === 0,
    source: "Yahoo Finance",
    recordsSynced: synced,
    errors,
    duration: Date.now() - start,
    timestamp: nowISO(),
  };
}

export async function syncPrices(symbols?: string[]): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  let securitySymbols: string[];
  if (symbols && symbols.length > 0) {
    securitySymbols = symbols.map((s) => s.toUpperCase());
  } else {
    const secs = await db.select({ symbol: schema.securities.symbol }).from(schema.securities);
    securitySymbols = secs.map((s) => s.symbol);
  }

  for (const symbol of securitySymbols) {
    try {
      const security = await db.query.securities.findFirst({
        where: eq(schema.securities.symbol, symbol),
      });
      if (!security) {
        errors.push(`Unknown symbol: ${symbol}`);
        continue;
      }

      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2y`
      );
      if (!res.ok) {
        errors.push(`Yahoo API error for ${symbol}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        errors.push(`No chart data for ${symbol}`);
        continue;
      }

      const timestamps = result.timestamp ?? [];
      const ohlc = result.indicators?.quote?.[0] ?? {};

      for (let i = 0; i < timestamps.length; i++) {
        const open = ohlc.open?.[i];
        const high = ohlc.high?.[i];
        const low = ohlc.low?.[i];
        const close = ohlc.close?.[i];
        const volume = ohlc.volume?.[i];

        if (open == null || high == null || low == null || close == null) continue;

        const date = new Date(timestamps[i] * 1000).toISOString();

        await db
          .insert(schema.prices)
          .values({
            securityId: security.id,
            timestamp: date,
            open,
            high,
            low,
            close,
            volume: volume ?? null,
          })
          .onConflictDoNothing();
        synced++;
      }
      await sleep(100); // Rate limit
    } catch (e) {
      errors.push(`Failed to sync prices for ${symbol}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  await updateDataSource("Yahoo Finance", "prices", synced);

  return {
    success: errors.length === 0,
    source: "Yahoo Finance",
    recordsSynced: synced,
    errors,
    duration: Date.now() - start,
    timestamp: nowISO(),
  };
}

export async function syncFinancials(tickers?: string[]): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  let companyTickers: string[];
  if (tickers && tickers.length > 0) {
    companyTickers = tickers.map((t) => t.toUpperCase());
  } else {
    const comps = await db.select({ ticker: schema.companies.ticker }).from(schema.companies);
    companyTickers = comps.map((c) => c.ticker);
  }

  for (const ticker of companyTickers) {
    try {
      const company = await db.query.companies.findFirst({
        where: eq(schema.companies.ticker, ticker),
      });
      if (!company) {
        errors.push(`Unknown company: ${ticker}`);
        continue;
      }

      const getVal = (obj: Record<string, unknown> | undefined, key: string): number | null => {
        if (!obj) return null;
        const v = obj[key];
        if (v == null) return null;
        return typeof v === "number" ? v : null;
      };

      const fmtDate = (d: string | Date): string => {
        const dt = typeof d === "string" ? new Date(d) : d;
        return dt.toISOString().split("T")[0];
      };

      // Fetch all three modules
      const [incomeData, balanceData, cashflowData] = await Promise.all([
        yahooFinance.fundamentalsTimeSeries(ticker, { module: "financials", period1: "2020-01-01", type: "annual" }),
        yahooFinance.fundamentalsTimeSeries(ticker, { module: "balance-sheet", period1: "2020-01-01", type: "annual" }),
        yahooFinance.fundamentalsTimeSeries(ticker, { module: "cash-flow", period1: "2020-01-01", type: "annual" }),
      ]);

      // Index by date for alignment
      const balanceByDate = new Map<string, Record<string, unknown>>();
      for (const b of balanceData) balanceByDate.set(fmtDate(b.date), b as unknown as Record<string, unknown>);
      const cashflowByDate = new Map<string, Record<string, unknown>>();
      for (const c of cashflowData) cashflowByDate.set(fmtDate(c.date), c as unknown as Record<string, unknown>);

      for (const inc of incomeData) {
        const period = fmtDate(inc.date);
        const balance = balanceByDate.get(period);
        const cashflow = cashflowByDate.get(period);
        const incR = inc as unknown as Record<string, unknown>;

        await db.insert(schema.financialStatements).values({
          companyId: company.id,
          period,
          periodType: inc.periodType === "12M" ? "annual" : "quarterly",
          revenue: getVal(incR, "totalRevenue"),
          costOfRevenue: getVal(incR, "costOfRevenue"),
          grossProfit: getVal(incR, "grossProfit"),
          operatingIncome: getVal(incR, "operatingIncome"),
          netIncome: getVal(incR, "netIncome"),
          eps: getVal(incR, "basicEPS"),
          assets: getVal(balance, "totalAssets"),
          liabilities: getVal(balance, "totalLiabilitiesNetMinorityInterest"),
          equity: getVal(balance, "stockholdersEquity"),
          cash: getVal(balance, "cashAndCashEquivalents"),
          debt: getVal(balance, "totalDebt"),
          operatingCashFlow: getVal(cashflow, "operatingCashFlow"),
          capex: getVal(cashflow, "capitalExpenditure"),
          freeCashFlow: getVal(cashflow, "freeCashFlow"),
        }).onConflictDoNothing();
        synced++;
      }

      // Also fetch quarterly
      const [incQ, balQ, cfQ] = await Promise.all([
        yahooFinance.fundamentalsTimeSeries(ticker, { module: "financials", period1: "2022-01-01", type: "quarterly" }),
        yahooFinance.fundamentalsTimeSeries(ticker, { module: "balance-sheet", period1: "2022-01-01", type: "quarterly" }),
        yahooFinance.fundamentalsTimeSeries(ticker, { module: "cash-flow", period1: "2022-01-01", type: "quarterly" }),
      ]);

      const balQByDate = new Map<string, Record<string, unknown>>();
      for (const b of balQ) balQByDate.set(fmtDate(b.date), b as unknown as Record<string, unknown>);
      const cfQByDate = new Map<string, Record<string, unknown>>();
      for (const c of cfQ) cfQByDate.set(fmtDate(c.date), c as unknown as Record<string, unknown>);

      for (const inc of incQ) {
        const period = fmtDate(inc.date);
        const balance = balQByDate.get(period);
        const cashflow = cfQByDate.get(period);
        const incR = inc as unknown as Record<string, unknown>;

        await db.insert(schema.financialStatements).values({
          companyId: company.id,
          period,
          periodType: "quarterly",
          revenue: getVal(incR, "totalRevenue"),
          costOfRevenue: getVal(incR, "costOfRevenue"),
          grossProfit: getVal(incR, "grossProfit"),
          operatingIncome: getVal(incR, "operatingIncome"),
          netIncome: getVal(incR, "netIncome"),
          eps: getVal(incR, "basicEPS"),
          assets: getVal(balance, "totalAssets"),
          liabilities: getVal(balance, "totalLiabilitiesNetMinorityInterest"),
          equity: getVal(balance, "stockholdersEquity"),
          cash: getVal(balance, "cashAndCashEquivalents"),
          debt: getVal(balance, "totalDebt"),
          operatingCashFlow: getVal(cashflow, "operatingCashFlow"),
          capex: getVal(cashflow, "capitalExpenditure"),
          freeCashFlow: getVal(cashflow, "freeCashFlow"),
        }).onConflictDoNothing();
        synced++;
      }

      await sleep(300);
    } catch (e) {
      errors.push(`Failed to sync financials for ${ticker}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  await updateDataSource("Yahoo Finance", "financials", synced);

  return {
    success: errors.length === 0,
    source: "Yahoo Finance",
    recordsSynced: synced,
    errors,
    duration: Date.now() - start,
    timestamp: nowISO(),
  };
}

const FRED_SERIES: { id: string; name: string; category: string; unit: string }[] = [
  { id: "GDP", name: "Gross Domestic Product", category: "GDP", unit: "Billions of Dollars" },
  { id: "UNRATE", name: "Unemployment Rate", category: "Employment", unit: "Percent" },
  { id: "CPIAUCSL", name: "Consumer Price Index", category: "Inflation", unit: "Index 1982-1984=100" },
  { id: "FEDFUNDS", name: "Federal Funds Rate", category: "Interest Rates", unit: "Percent" },
  { id: "T10Y2Y", name: "10-Year Treasury Yield", category: "Interest Rates", unit: "Percent" },
  { id: "DGS10", name: "10-Year Treasury Rate", category: "Interest Rates", unit: "Percent" },
  { id: "DGS2", name: "2-Year Treasury Rate", category: "Interest Rates", unit: "Percent" },
  { id: "DGS30", name: "30-Year Treasury Rate", category: "Interest Rates", unit: "Percent" },
  { id: "VIXCLS", name: "VIX Volatility Index", category: "Market", unit: "Index" },
  { id: "SP500", name: "S&P 500 Index", category: "Market", unit: "Index" },
];

export async function syncEconomicIndicators(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  for (const series of FRED_SERIES) {
    try {
      const res = await fetch(
        `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series.id}&cosd=2024-01-01`
      );
      if (!res.ok) {
        errors.push(`FRED API error for ${series.id}: ${res.status}`);
        continue;
      }

      const text = await res.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) continue;

      const header = lines[0].split(",");
      const dateIndex = 0;
      const valueIndex = header.length > 1 ? 1 : -1;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        const date = parts[dateIndex]?.trim();
        const valueStr = parts[valueIndex]?.trim();

        if (!date || !valueStr || valueStr === "." || valueStr === "") continue;

        const value = parseFloat(valueStr);
        if (isNaN(value)) continue;

        await db.insert(schema.economicIndicators).values({
          name: series.name,
          country: "US",
          timestamp: new Date(date).toISOString(),
          value,
          unit: series.unit,
          source: "FRED",
          category: series.category,
        });
        synced++;
      }
    } catch (e) {
      errors.push(`Failed to sync ${series.id}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  await updateDataSource("FRED", "economic", synced);

  return {
    success: errors.length === 0,
    source: "FRED",
    recordsSynced: synced,
    errors,
    duration: Date.now() - start,
    timestamp: nowISO(),
  };
}

const TOP_COINS = ["bitcoin", "ethereum", "tether", "binancecoin", "solana", "ripple", "cardano", "dogecoin", "polkadot", "avalanche-2"];

export async function syncCrypto(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  for (const coinId of TOP_COINS) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
      );
      if (!res.ok) {
        errors.push(`CoinGecko API error for ${coinId}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const symbol = (data.symbol ?? coinId).toUpperCase();
      const name = data.name ?? coinId;
      const marketData = data.market_data ?? {};
      const ts = nowISO();

      const existingCompany = await db.query.companies.findFirst({
        where: eq(schema.companies.ticker, symbol),
      });

      if (!existingCompany) {
        await db.insert(schema.companies).values({
          name,
          ticker: symbol,
          exchange: "CRYPTO",
          sector: "Cryptocurrency",
          industry: "Digital Currency",
          country: "Global",
          description: name,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      const company = await db.query.companies.findFirst({
        where: eq(schema.companies.ticker, symbol),
      });

      const existingSec = await db.query.securities.findFirst({
        where: eq(schema.securities.symbol, symbol),
      });

      const currentPrice = marketData.current_price?.usd ?? null;
      const marketCap = marketData.market_cap?.usd ?? null;

      if (existingSec) {
        await db
          .update(schema.securities)
          .set({
            name,
            assetType: "crypto",
            currency: "USD",
            exchange: "CRYPTO",
            marketCap,
            updatedAt: ts,
          })
          .where(eq(schema.securities.id, existingSec.id));
      } else {
        await db.insert(schema.securities).values({
          companyId: company?.id ?? null,
          symbol,
          name,
          assetType: "crypto",
          currency: "USD",
          exchange: "CRYPTO",
          marketCap,
          createdAt: ts,
          updatedAt: ts,
        });
      }

      const security = await db.query.securities.findFirst({
        where: eq(schema.securities.symbol, symbol),
      });

      if (security && currentPrice) {
        await db
          .insert(schema.prices)
          .values({
            securityId: security.id,
            timestamp: ts,
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
            volume: marketData.total_volume?.usd ?? null,
          })
          .onConflictDoNothing();
        synced++;
      }

      await sleep(3500); // CoinGecko free tier: ~30 req/min
    } catch (e) {
      errors.push(`Failed to sync crypto ${coinId}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  await updateDataSource("CoinGecko", "crypto", synced);

  return {
    success: errors.length === 0,
    source: "CoinGecko",
    recordsSynced: synced,
    errors,
    duration: Date.now() - start,
    timestamp: nowISO(),
  };
}

export async function syncNews(tickers?: string[]): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  const symbols = tickers && tickers.length > 0
    ? tickers.map((t) => t.toUpperCase())
    : DEFAULT_TICKERS.slice(0, 10);

  for (const symbol of symbols) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchResult: any = await yahooFinance.search(symbol, { newsCount: 5, quotesCount: 0 });
      const items = searchResult.news ?? [];

      for (const item of items) {
        try {
          const title = item.title ?? "Untitled";
          // Dedup by title
          const existing = await db.query.news.findFirst({
            where: eq(schema.news.title, title),
          });
          if (existing) continue;

          // Find related company
          let relatedCompanyId: number | null = null;
          const company = await db.query.companies.findFirst({
            where: eq(schema.companies.ticker, symbol),
          });
          relatedCompanyId = company?.id ?? null;

          await db.insert(schema.news).values({
            title,
            summary: item.summary ?? null,
            source: item.publisher ?? "Yahoo Finance",
            url: item.link ?? null,
            publishedAt: item.providerPublishTime
              ? new Date(item.providerPublishTime * 1000).toISOString()
              : nowISO(),
            relatedCompanyId,
            relatedSymbol: symbol,
          });
          synced++;
        } catch {
          // skip duplicates
        }
      }
      await sleep(200);
    } catch (e) {
      errors.push(`Failed to sync news for ${symbol}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  await updateDataSource("Yahoo Finance", "news", synced);

  return {
    success: errors.length === 0,
    source: "Yahoo Finance",
    recordsSynced: synced,
    errors,
    duration: Date.now() - start,
    timestamp: nowISO(),
  };
}

export async function syncAll(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  console.log("[Sync] Starting companies...");
  results.push(await syncCompanies());
  console.log("[Sync] Starting prices...");
  results.push(await syncPrices());
  console.log("[Sync] Starting financials...");
  results.push(await syncFinancials());
  console.log("[Sync] Starting economic indicators...");
  results.push(await syncEconomicIndicators());
  console.log("[Sync] Starting crypto...");
  results.push(await syncCrypto());
  console.log("[Sync] Starting news...");
  results.push(await syncNews());
  console.log("[Sync] Starting RSS news...");
  results.push(await syncRssNews());
  console.log("[Sync] Starting SEC filings...");
  results.push(await syncFilings());
  console.log("[Sync] Starting insider transactions...");
  results.push(await syncInsiderTransactions());
  console.log("[Sync] Starting yield curve...");
  results.push(await syncYieldCurve());
  console.log("[Sync] Starting macro calendar...");
  results.push(await syncMacroCalendar());
  console.log("[Sync] Starting World Bank global macro...");
  results.push(await syncWorldBankData());
  console.log("[Sync] Starting market sentiment index...");
  results.push(await syncMarketSentiment());


  return results;
}

export async function syncExpandedTickers(): Promise<SyncResult> {
  const start = Date.now();
  const tickers = EXPANDED_TICKERS.map((t) => t.ticker);
  const result = await syncCompanies(tickers);
  return { ...result, source: "Yahoo Finance (Expanded)" };
}

export async function syncEtfTickers(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];
  const ts = nowISO();

  for (const ticker of ETF_TICKERS) {
    try {
      const existing = await db.query.companies.findFirst({ where: eq(schema.companies.ticker, ticker) });
      if (existing) { synced++; continue; }

      const quote = await yahooFinance.quote(ticker).catch(() => null);
      if (!quote) { errors.push(`No data for ${ticker}`); continue; }

      const [company] = await db.insert(schema.companies).values({
        name: quote.longName ?? quote.shortName ?? ticker,
        ticker,
        exchange: quote.exchange ?? "NYSE",
        sector: "ETF",
        industry: "Exchange Traded Fund",
        country: "US",
        description: `ETF: ${quote.longName ?? ticker}`,
        website: null,
        createdAt: ts,
        updatedAt: ts,
      }).returning();

      await db.insert(schema.securities).values({
        companyId: company.id,
        symbol: ticker,
        name: quote.longName ?? quote.shortName ?? ticker,
        assetType: "equity",
        currency: "USD",
        exchange: quote.exchange ?? "NYSE",
        marketCap: quote.marketCap ?? null,
        peRatio: quote.trailingPE ?? null,
        eps: quote.epsTrailingTwelveMonths ?? null,
        beta: quote.beta3Month ?? null,
        high52w: quote.fiftyTwoWeekHigh ?? null,
        low52w: quote.fiftyTwoWeekLow ?? null,
        sharesOutstanding: quote.sharesOutstanding ?? null,
        createdAt: ts,
        updatedAt: ts,
      });
      synced++;
      await sleep(200);
    } catch (e) {
      errors.push(`Failed ETF ${ticker}: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  }

  await updateDataSource("Yahoo Finance", "etfs", synced);
  return { success: errors.length === 0, source: "Yahoo Finance (ETFs)", recordsSynced: synced, errors, duration: Date.now() - start, timestamp: nowISO() };
}

export async function syncRssNews(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  try {
    const articles = await fetchRssNews();
    for (const article of articles) {
      try {
        const existing = await db.query.news.findFirst({ where: eq(schema.news.title, article.title) });
        if (existing) continue;

        let relatedCompanyId: number | null = null;
        if (article.relatedSymbol) {
          const company = await db.query.companies.findFirst({ where: eq(schema.companies.ticker, article.relatedSymbol) });
          relatedCompanyId = company?.id ?? null;
        }

        await db.insert(schema.news).values({
          title: article.title,
          summary: article.summary,
          source: article.source,
          url: article.url,
          publishedAt: article.publishedAt,
          relatedCompanyId,
          relatedSymbol: article.relatedSymbol ?? null,
        });
        synced++;
      } catch {}
    }
  } catch (e) {
    errors.push(`RSS fetch failed: ${e instanceof Error ? e.message : "Unknown"}`);
  }

  await updateDataSource("RSS Feeds", "news", synced);
  return { success: errors.length === 0, source: "RSS Feeds", recordsSynced: synced, errors, duration: Date.now() - start, timestamp: nowISO() };
}

export async function syncFilings(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  try {
    const filings = await fetchRecentFilings();
    for (const filing of filings) {
      try {
        const company = await db.query.companies.findFirst({ where: eq(schema.companies.ticker, filing.ticker) });

        await db.insert(schema.filings).values({
          companyId: company?.id ?? null,
          ticker: filing.ticker,
          type: filing.type,
          title: filing.title,
          description: filing.description,
          url: filing.url,
          filedAt: filing.filedAt,
          source: "SEC EDGAR",
        });
        synced++;
      } catch {}
    }
  } catch (e) {
    errors.push(`SEC filings failed: ${e instanceof Error ? e.message : "Unknown"}`);
  }

  await updateDataSource("SEC EDGAR", "filings", synced);
  return { success: errors.length === 0, source: "SEC EDGAR", recordsSynced: synced, errors, duration: Date.now() - start, timestamp: nowISO() };
}

export async function syncInsiderTransactions(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  try {
    const trades = await fetchInsiderTransactions();
    for (const trade of trades) {
      try {
        const company = await db.query.companies.findFirst({ where: eq(schema.companies.ticker, trade.ticker) });

        await db.insert(schema.insiderTransactions).values({
          companyId: company?.id ?? null,
          ticker: trade.ticker,
          insiderName: trade.insiderName,
          title: trade.title,
          transactionType: trade.transactionType,
          shares: trade.shares,
          price: trade.price,
          totalValue: (trade.shares ?? 0) * (trade.price ?? 0),
          filedAt: trade.filedAt,
          source: "SEC EDGAR",
        });
        synced++;
      } catch {}
    }
  } catch (e) {
    errors.push(`Insider transactions failed: ${e instanceof Error ? e.message : "Unknown"}`);
  }

  await updateDataSource("SEC EDGAR", "insider_transactions", synced);
  return { success: errors.length === 0, source: "SEC EDGAR", recordsSynced: synced, errors, duration: Date.now() - start, timestamp: nowISO() };
}

export async function syncYieldCurve(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  try {
    const points = await fetchYieldCurve();
    for (const p of points) {
      try {
        await db.insert(schema.yieldCurve).values({
          date: p.date,
          maturity: p.maturity,
          yieldValue: p.yieldValue,
          spreadVs10Y: p.spreadVs10Y,
          source: "US Treasury via FRED",
        });
        synced++;
      } catch {}
    }
  } catch (e) {
    errors.push(`Yield curve failed: ${e instanceof Error ? e.message : "Unknown"}`);
  }

  await updateDataSource("FRED", "yield_curve", synced);
  return { success: errors.length === 0, source: "US Treasury", recordsSynced: synced, errors, duration: Date.now() - start, timestamp: nowISO() };
}

export async function syncMacroCalendar(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  try {
    const events = generateMacroCalendar("2024-01-01", "2026-12-31");
    for (const ev of events) {
      try {
        await db.insert(schema.macroEvents).values({
          type: ev.type,
          title: ev.title,
          description: ev.description,
          date: ev.date,
          time: ev.time,
          importance: ev.importance,
          source: ev.source,
        });
        synced++;
      } catch {}
    }
  } catch (e) {
    errors.push(`Macro calendar failed: ${e instanceof Error ? e.message : "Unknown"}`);
  }

  await updateDataSource("ATLAS", "macro_calendar", synced);
  return { success: errors.length === 0, source: "Macro Calendar", recordsSynced: synced, errors, duration: Date.now() - start, timestamp: nowISO() };
}

export async function syncWorldBankData(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  try {
    const indicators = await fetchWorldBankIndicators();
    for (const ind of indicators) {
      try {
        await db.insert(schema.economicIndicators).values({
          name: ind.name,
          country: ind.country,
          timestamp: ind.timestamp,
          value: ind.value,
          unit: ind.unit,
          source: ind.source,
          category: ind.category,
        });
        synced++;
      } catch {}
    }
  } catch (e) {
    errors.push(`World Bank sync failed: ${e instanceof Error ? e.message : "Unknown"}`);
  }

  await updateDataSource("World Bank", "economic", synced);
  return {
    success: errors.length === 0,
    source: "World Bank",
    recordsSynced: synced,
    errors,
    duration: Date.now() - start,
    timestamp: nowISO(),
  };
}

export async function syncMarketSentiment(): Promise<SyncResult> {
  const start = Date.now();
  const db = getDb();
  let synced = 0;
  const errors: string[] = [];

  try {
    const sentiments = await fetchMarketSentiment(365);
    for (const item of sentiments) {
      try {
        await db
          .insert(schema.marketSentiment)
          .values({
            timestamp: item.timestamp,
            score: item.score,
            classification: item.classification,
            assetClass: item.assetClass,
            source: item.source,
          })
          .onConflictDoNothing();
        synced++;
      } catch {}
    }
  } catch (e) {
    errors.push(`Market sentiment sync failed: ${e instanceof Error ? e.message : "Unknown"}`);
  }

  await updateDataSource("Alternative.me", "sentiment", synced);
  return {
    success: errors.length === 0,
    source: "Alternative.me",
    recordsSynced: synced,
    errors,
    duration: Date.now() - start,
    timestamp: nowISO(),
  };
}

