export type AssetType = "equity" | "index" | "currency" | "commodity" | "crypto" | "bond";
export type PeriodType = "annual" | "quarterly";
export type ChartRange = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "5Y" | "MAX";
export type UIMode = "explorer" | "terminal";
export type Density = "compact" | "comfortable";

export interface Quote {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  timestamp: string | null;
  assetType: AssetType;
}

export interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface Company {
  id: number;
  name: string;
  ticker: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  country: string | null;
  description: string | null;
  website: string | null;
}

export interface CompanyDetail extends Company {
  quote: Quote | null;
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
  dataTimestamp: string | null;
}

export interface FinancialStatement {
  id: number;
  companyId: number;
  period: string;
  periodType: PeriodType;
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

export interface SearchResult {
  id: string;
  type: "company" | "market" | "currency" | "commodity" | "crypto" | "bond";
  symbol: string;
  name: string;
  subtitle?: string;
  href: string;
}

export interface ScreenerFilter {
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPe?: number;
  maxPe?: number;
  minRevenueGrowth?: number;
  minProfitMargin?: number;
  maxDebt?: number;
  minDividendYield?: number;
  sector?: string;
  country?: string;
  exchange?: string;
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  sector: string | null;
  exchange: string | null;
  price: number | null;
  marketCap: number | null;
  peRatio: number | null;
  revenueGrowth: number | null;
  netMargin: number | null;
  dividendYield: number | null;
  debt: number | null;
}

export interface AppSettings {
  theme: "dark" | "light";
  density: Density;
  uiMode: UIMode;
  defaultWatchlistId: number | null;
  defaultChartRange: ChartRange;
}

export interface ImportResult {
  recordsImported: number;
  recordsRejected: number;
  errors: string[];
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote | null>;
  getHistoricalPrices(symbol: string, range: ChartRange): Promise<PricePoint[]>;
  getCompany(symbol: string): Promise<CompanyDetail | null>;
  getFinancials(symbol: string, periodType?: PeriodType): Promise<FinancialStatement[]>;
}
