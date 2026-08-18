/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinance from "yahoo-finance2";
import type {
  NormalizedCompany,
  NormalizedPrice,
  NormalizedFinancial,
  NormalizedNews,
  DataProvider,
} from "./types";

const yf = new YahooFinance({
  validation: { logErrors: false },
  queue: { concurrency: 2 },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDateStr(d: Date | string | number): string {
  if (d instanceof Date) return d.toISOString();
  return new Date(d).toISOString();
}

function quarterFromDate(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q}`;
}

function parseFinancialFromFundamentals(
  ticker: string,
  data: Record<string, any>
): NormalizedFinancial {
  const date = data.date instanceof Date ? data.date : new Date(data.date);
  const year = date.getFullYear();
  const quarter = quarterFromDate(date);

  let periodType: "annual" | "quarterly";
  let period: string;

  if (data.periodType === "3M") {
    periodType = "quarterly";
    period = `${year}-${quarter}`;
  } else {
    periodType = "annual";
    period = String(year);
  }

  const type = data.TYPE as string;

  return {
    ticker,
    period,
    periodType,
    revenue: type === "FINANCIALS" ? (data.totalRevenue ?? data.operatingRevenue ?? null) : null,
    costOfRevenue: type === "FINANCIALS" ? (data.costOfRevenue ?? data.reconciledCostOfRevenue ?? null) : null,
    grossProfit: type === "FINANCIALS" ? (data.grossProfit ?? null) : null,
    operatingIncome: type === "FINANCIALS" ? (data.operatingIncome ?? data.totalOperatingIncomeAsReported ?? null) : null,
    netIncome: type === "FINANCIALS" ? (data.netIncome ?? null) : null,
    eps: type === "FINANCIALS" ? (data.basicEPS ?? data.dilutedEPS ?? null) : null,
    assets: type === "BALANCE_SHEET" ? (data.totalAssets ?? null) : null,
    liabilities: type === "BALANCE_SHEET" ? (data.totalLiabilitiesNetMinorityInterest ?? null) : null,
    equity: type === "BALANCE_SHEET"
      ? (data.stockholdersEquity ?? data.totalEquityGrossMinorityInterest ?? null)
      : null,
    cash: type === "BALANCE_SHEET"
      ? (data.cashCashEquivalentsAndShortTermInvestments ?? data.cashAndCashEquivalents ?? null)
      : null,
    debt: type === "BALANCE_SHEET"
      ? (data.totalDebt ?? data.longTermDebt ?? null)
      : null,
    operatingCashFlow: type === "CASH_FLOW"
      ? (data.operatingCashFlow ?? data.cashFlowFromContinuingOperatingActivities ?? null)
      : null,
    capex: type === "CASH_FLOW"
      ? (data.capitalExpenditure ?? data.capitalExpenditureReported ?? null)
      : null,
    freeCashFlow: type === "CASH_FLOW" ? (data.freeCashFlow ?? null) : null,
  };
}

export class YahooFinanceProvider implements DataProvider {
  name = "yahoo-finance";

  async fetchCompanies(tickers: string[]): Promise<NormalizedCompany[]> {
    const results: NormalizedCompany[] = [];

    for (let i = 0; i < tickers.length; i += 5) {
      const batch = tickers.slice(i, i + 5);

      try {
        const quotes = await yf.quote(batch);
        const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

        for (const q of quoteArray) {
          try {
            let summary: Record<string, any> | null = null;
            try {
              summary = await yf.quoteSummary(q.symbol, {
                modules: ["assetProfile", "defaultKeyStatistics", "financialData"],
              }) as Record<string, any>;
              await sleep(100);
            } catch {
              // Fall back to quote data only
            }

            const profile = summary?.assetProfile ?? null;
            const stats = summary?.defaultKeyStatistics ?? null;
            const finData = summary?.financialData ?? null;

            results.push({
              ticker: q.symbol,
              name: q.longName ?? q.shortName ?? q.symbol,
              exchange: q.fullExchangeName ?? q.exchange ?? "",
              sector: profile?.sector ?? null,
              industry: profile?.industry ?? null,
              country: profile?.country ?? null,
              description: profile?.longBusinessSummary ?? null,
              website: profile?.website ?? null,
              marketCap: q.marketCap ?? finData?.marketCap ?? null,
              peRatio: (q as any).trailingPE ?? (q as any).forwardPE ?? null,
              eps: (q as any).epsTrailingTwelveMonths ?? null,
              revenue: finData?.totalRevenue ?? null,
              netMargin: finData?.profitMargins ? finData.profitMargins * 100 : null,
              revenueGrowth: finData?.revenueGrowth ? finData.revenueGrowth * 100 : null,
              dividendYield: (q as any).trailingAnnualDividendYield
                ? (q as any).trailingAnnualDividendYield * 100
                : null,
              debt: finData?.totalDebt ?? null,
              beta: (q as any).beta ?? null,
              priceToSales: (q as any).priceToBook ?? null,
              priceToBook: (q as any).priceToBook ?? null,
              evToEbitda: stats?.enterpriseToEbitda ?? null,
              high52w: q.fiftyTwoWeekHigh ?? null,
              low52w: q.fiftyTwoWeekLow ?? null,
              sharesOutstanding:
                (q as any).sharesOutstanding ?? stats?.sharesOutstanding ?? null,
              currentPrice: (q as any).regularMarketPrice ?? null,
            });
          } catch (err) {
            console.error(`[YahooFinance] Error processing ${q.symbol}:`, err);
          }
        }
      } catch (err) {
        console.error(`[YahooFinance] Batch error for ${batch.join(",")}:`, err);
      }

      if (i + 5 < tickers.length) {
        await sleep(100);
      }
    }

    return results;
  }

  async fetchPrices(symbol: string, range: string): Promise<NormalizedPrice[]> {
    const now = new Date();
    let period1: Date;

    switch (range) {
      case "1D":
        period1 = new Date(now);
        period1.setDate(period1.getDate() - 1);
        break;
      case "5D":
        period1 = new Date(now);
        period1.setDate(period1.getDate() - 5);
        break;
      case "1M":
        period1 = new Date(now);
        period1.setMonth(period1.getMonth() - 1);
        break;
      case "6M":
        period1 = new Date(now);
        period1.setMonth(period1.getMonth() - 6);
        break;
      case "1Y":
        period1 = new Date(now);
        period1.setFullYear(period1.getFullYear() - 1);
        break;
      case "5Y":
        period1 = new Date(now);
        period1.setFullYear(period1.getFullYear() - 5);
        break;
      case "MAX":
        period1 = new Date("1970-01-01");
        break;
      default:
        period1 = new Date(now);
        period1.setMonth(period1.getMonth() - 1);
    }

    try {
      const history: any[] = await yf.historical(symbol, {
        period1,
        period2: now,
        interval: "1d",
      });

      return history.map((row: any) => ({
        symbol,
        timestamp: toDateStr(row.date),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume ?? null,
      }));
    } catch (err) {
      console.error(`[YahooFinance] Error fetching prices for ${symbol}:`, err);
      return [];
    }
  }

  async fetchFinancials(ticker: string): Promise<NormalizedFinancial[]> {
    const results: NormalizedFinancial[] = [];

    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - 5);

    // Fetch quarterly financials
    try {
      const financials: any[] = await yf.fundamentalsTimeSeries(ticker, {
        period1,
        type: "quarterly",
        module: "financials",
      });

      for (const item of financials) {
        results.push(parseFinancialFromFundamentals(ticker, item));
      }
    } catch (err) {
      console.error(`[YahooFinance] Error fetching quarterly financials for ${ticker}:`, err);
    }

    await sleep(100);

    // Fetch quarterly balance sheet
    try {
      const bs: any[] = await yf.fundamentalsTimeSeries(ticker, {
        period1,
        type: "quarterly",
        module: "balance-sheet",
      });

      for (const item of bs) {
        const parsed = parseFinancialFromFundamentals(ticker, item);
        const existing = results.find(
          (r) => r.periodType === "quarterly" && r.period === parsed.period
        );
        if (existing) {
          existing.assets = item.totalAssets ?? existing.assets;
          existing.liabilities = item.totalLiabilitiesNetMinorityInterest ?? existing.liabilities;
          existing.equity = item.stockholdersEquity ?? item.totalEquityGrossMinorityInterest ?? existing.equity;
          existing.cash = item.cashCashEquivalentsAndShortTermInvestments ?? item.cashAndCashEquivalents ?? existing.cash;
          existing.debt = item.totalDebt ?? item.longTermDebt ?? existing.debt;
        } else {
          results.push(parsed);
        }
      }
    } catch (err) {
      console.error(`[YahooFinance] Error fetching quarterly balance sheet for ${ticker}:`, err);
    }

    await sleep(100);

    // Fetch quarterly cash flow
    try {
      const cf: any[] = await yf.fundamentalsTimeSeries(ticker, {
        period1,
        type: "quarterly",
        module: "cash-flow",
      });

      for (const item of cf) {
        const parsed = parseFinancialFromFundamentals(ticker, item);
        const existing = results.find(
          (r) => r.periodType === "quarterly" && r.period === parsed.period
        );
        if (existing) {
          existing.operatingCashFlow = item.operatingCashFlow ?? item.cashFlowFromContinuingOperatingActivities ?? existing.operatingCashFlow;
          existing.capex = item.capitalExpenditure ?? item.capitalExpenditureReported ?? existing.capex;
          existing.freeCashFlow = item.freeCashFlow ?? existing.freeCashFlow;
        } else {
          results.push(parsed);
        }
      }
    } catch (err) {
      console.error(`[YahooFinance] Error fetching quarterly cash flow for ${ticker}:`, err);
    }

    await sleep(100);

    // Fetch annual financials
    try {
      const annualFin: any[] = await yf.fundamentalsTimeSeries(ticker, {
        period1,
        type: "annual",
        module: "financials",
      });

      for (const item of annualFin) {
        results.push(parseFinancialFromFundamentals(ticker, item));
      }
    } catch (err) {
      console.error(`[YahooFinance] Error fetching annual financials for ${ticker}:`, err);
    }

    await sleep(100);

    // Fetch annual balance sheet
    try {
      const annualBs: any[] = await yf.fundamentalsTimeSeries(ticker, {
        period1,
        type: "annual",
        module: "balance-sheet",
      });

      for (const item of annualBs) {
        const parsed = parseFinancialFromFundamentals(ticker, item);
        const existing = results.find(
          (r) => r.periodType === "annual" && r.period === parsed.period
        );
        if (existing) {
          existing.assets = item.totalAssets ?? existing.assets;
          existing.liabilities = item.totalLiabilitiesNetMinorityInterest ?? existing.liabilities;
          existing.equity = item.stockholdersEquity ?? item.totalEquityGrossMinorityInterest ?? existing.equity;
          existing.cash = item.cashCashEquivalentsAndShortTermInvestments ?? item.cashAndCashEquivalents ?? existing.cash;
          existing.debt = item.totalDebt ?? item.longTermDebt ?? existing.debt;
        } else {
          results.push(parsed);
        }
      }
    } catch (err) {
      console.error(`[YahooFinance] Error fetching annual balance sheet for ${ticker}:`, err);
    }

    await sleep(100);

    // Fetch annual cash flow
    try {
      const annualCf: any[] = await yf.fundamentalsTimeSeries(ticker, {
        period1,
        type: "annual",
        module: "cash-flow",
      });

      for (const item of annualCf) {
        const parsed = parseFinancialFromFundamentals(ticker, item);
        const existing = results.find(
          (r) => r.periodType === "annual" && r.period === parsed.period
        );
        if (existing) {
          existing.operatingCashFlow = item.operatingCashFlow ?? item.cashFlowFromContinuingOperatingActivities ?? existing.operatingCashFlow;
          existing.capex = item.capitalExpenditure ?? item.capitalExpenditureReported ?? existing.capex;
          existing.freeCashFlow = item.freeCashFlow ?? existing.freeCashFlow;
        } else {
          results.push(parsed);
        }
      }
    } catch (err) {
      console.error(`[YahooFinance] Error fetching annual cash flow for ${ticker}:`, err);
    }

    return results;
  }

  async fetchNews(tickers: string[]): Promise<NormalizedNews[]> {
    const results: NormalizedNews[] = [];

    for (const ticker of tickers) {
      try {
        const searchResult: any = await yf.search(ticker, {
          quotesCount: 0,
          newsCount: 5,
        });

        for (const article of searchResult.news ?? []) {
          results.push({
            title: article.title,
            summary: null,
            source: article.publisher ?? null,
            url: article.link ?? null,
            publishedAt: article.providerPublishTime
              ? toDateStr(article.providerPublishTime)
              : new Date().toISOString(),
            relatedSymbol: ticker,
          });
        }

        await sleep(100);
      } catch (err) {
        console.error(`[YahooFinance] Error fetching news for ${ticker}:`, err);
      }
    }

    return results;
  }
}
