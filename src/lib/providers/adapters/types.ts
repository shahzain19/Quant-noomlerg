// Normalized data types that all providers output
export interface NormalizedCompany {
  ticker: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  country: string | null;
  description: string | null;
  website: string | null;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  revenue: number | null;
  netMargin: number | null;
  revenueGrowth: number | null;
  dividendYield: number | null;
  debt: number | null;
  beta: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  evToEbitda: number | null;
  high52w: number | null;
  low52w: number | null;
  sharesOutstanding: number | null;
  currentPrice: number | null;
}

export interface NormalizedPrice {
  symbol: string;
  timestamp: string; // ISO string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface NormalizedFinancial {
  ticker: string;
  period: string; // "2024" or "2024-Q1"
  periodType: "annual" | "quarterly";
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
  assets: number | null;
  liabilities: number | null;
  equity: number | null;
  cash: number | null;
  debt: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  freeCashFlow: number | null;
}

export interface NormalizedEconomicIndicator {
  name: string;
  country: string;
  timestamp: string;
  value: number;
  unit: string | null;
  source: string;
  category: string | null;
}

export interface NormalizedNews {
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  publishedAt: string;
  relatedSymbol: string | null;
}

export interface NormalizedMarketSentiment {
  timestamp: string;
  score: number;
  classification: string;
  assetClass: string;
  source: string;
}

export interface SyncResult {
  source: string;
  dataType: string;
  recordsImported: number;
  recordsSkipped: number;
  recordsRejected: number;
  errors: string[];
  duration: number;
}

export interface DataProvider {
  name: string;
  fetchCompanies?(tickers: string[]): Promise<NormalizedCompany[]>;
  fetchPrices?(symbol: string, range: string): Promise<NormalizedPrice[]>;
  fetchFinancials?(ticker: string): Promise<NormalizedFinancial[]>;
  fetchEconomicIndicators?(): Promise<NormalizedEconomicIndicator[]>;
  fetchNews?(tickers: string[]): Promise<NormalizedNews[]>;
  fetchCrypto?(): Promise<NormalizedCompany[]>;
  fetchCryptoPrices?(symbol: string, days: number): Promise<NormalizedPrice[]>;
  fetchMarketSentiment?(limitDays?: number): Promise<NormalizedMarketSentiment[]>;
}

