import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ticker: text("ticker").notNull().unique(),
  exchange: text("exchange").notNull(),
  sector: text("sector"),
  industry: text("industry"),
  country: text("country").default("US"),
  description: text("description"),
  website: text("website"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const securities = sqliteTable(
  "securities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id").references(() => companies.id),
    symbol: text("symbol").notNull().unique(),
    name: text("name").notNull(),
    assetType: text("asset_type").notNull(), // equity, index, currency, commodity, crypto, bond
    currency: text("currency").default("USD"),
    exchange: text("exchange"),
    marketCap: real("market_cap"),
    peRatio: real("pe_ratio"),
    eps: real("eps"),
    revenue: real("revenue"),
    netMargin: real("net_margin"),
    revenueGrowth: real("revenue_growth"),
    dividendYield: real("dividend_yield"),
    debt: real("debt"),
    beta: real("beta"),
    priceToSales: real("price_to_sales"),
    priceToBook: real("price_to_book"),
    evToEbitda: real("ev_to_ebitda"),
    high52w: real("high_52w"),
    low52w: real("low_52w"),
    sharesOutstanding: real("shares_outstanding"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("securities_asset_type_idx").on(table.assetType),
    index("securities_company_id_idx").on(table.companyId),
  ]
);

export const prices = sqliteTable(
  "prices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    securityId: integer("security_id")
      .notNull()
      .references(() => securities.id),
    timestamp: text("timestamp").notNull(),
    open: real("open").notNull(),
    high: real("high").notNull(),
    low: real("low").notNull(),
    close: real("close").notNull(),
    volume: real("volume"),
  },
  (table) => [
    index("prices_security_timestamp_idx").on(table.securityId, table.timestamp),
    uniqueIndex("prices_security_timestamp_unique").on(table.securityId, table.timestamp),
  ]
);

export const financialStatements = sqliteTable(
  "financial_statements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id),
    period: text("period").notNull(),
    periodType: text("period_type").notNull(), // annual | quarterly
    revenue: real("revenue"),
    costOfRevenue: real("cost_of_revenue"),
    grossProfit: real("gross_profit"),
    operatingIncome: real("operating_income"),
    netIncome: real("net_income"),
    eps: real("eps"),
    assets: real("assets"),
    liabilities: real("liabilities"),
    equity: real("equity"),
    cash: real("cash"),
    debt: real("debt"),
    operatingCashFlow: real("operating_cash_flow"),
    capex: real("capex"),
    freeCashFlow: real("free_cash_flow"),
  },
  (table) => [
    index("financials_company_period_idx").on(table.companyId, table.period),
    uniqueIndex("financials_company_period_type_unique").on(
      table.companyId,
      table.period,
      table.periodType
    ),
  ]
);

export const economicIndicators = sqliteTable(
  "economic_indicators",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    country: text("country").notNull(),
    timestamp: text("timestamp").notNull(),
    value: real("value").notNull(),
    unit: text("unit"),
    source: text("source"),
    category: text("category"),
  },
  (table) => [index("economic_name_timestamp_idx").on(table.name, table.timestamp)]
);

export const news = sqliteTable("news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  summary: text("summary"),
  source: text("source"),
  url: text("url"),
  publishedAt: text("published_at").notNull(),
  relatedCompanyId: integer("related_company_id").references(() => companies.id),
  relatedSymbol: text("related_symbol"),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  companyId: integer("company_id").references(() => companies.id),
});

export const watchlists = sqliteTable("watchlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const watchlistItems = sqliteTable(
  "watchlist_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    watchlistId: integer("watchlist_id")
      .notNull()
      .references(() => watchlists.id, { onDelete: "cascade" }),
    securityId: integer("security_id")
      .notNull()
      .references(() => securities.id),
    sortOrder: integer("sort_order").default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("watchlist_items_watchlist_idx").on(table.watchlistId),
    uniqueIndex("watchlist_items_unique").on(table.watchlistId, table.securityId),
  ]
);

export const dataSources = sqliteTable("data_sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  lastImportAt: text("last_import_at"),
  recordsImported: integer("records_imported").default(0),
  recordsRejected: integer("records_rejected").default(0),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const importLogs = sqliteTable("import_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  datasetType: text("dataset_type").notNull(),
  recordsImported: integer("records_imported").default(0),
  recordsRejected: integer("records_rejected").default(0),
  importedAt: text("imported_at").notNull(),
  filename: text("filename"),
});

export const filings = sqliteTable("filings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").references(() => companies.id),
  ticker: text("ticker").notNull(),
  type: text("type").notNull(), // 10-K, 10-Q, 8-K, 4, 13F, SC 13D
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  filedAt: text("filed_at").notNull(),
  source: text("source").default("SEC EDGAR"),
});

export const insiderTransactions = sqliteTable("insider_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").references(() => companies.id),
  ticker: text("ticker").notNull(),
  insiderName: text("insider_name").notNull(),
  title: text("title"),
  transactionType: text("transaction_type").notNull(), // buy, sell, grant, option_exercise
  shares: real("shares"),
  price: real("price"),
  totalValue: real("total_value"),
  filedAt: text("filed_at").notNull(),
  source: text("source").default("SEC EDGAR"),
});

export const yieldCurve = sqliteTable("yield_curve", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  maturity: text("maturity").notNull(), // 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y
  yieldValue: real("yield_value").notNull(),
  spreadVs10Y: real("spread_vs_10y"),
  source: text("source").default("US Treasury"),
});

export const macroEvents = sqliteTable("macro_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // fed_meeting, cpi_release, jobs_report, earnings_season, gdp_release, pce_release
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  time: text("time"),
  importance: text("importance").default("high"), // high, medium, low
  source: text("source"),
});

export const marketSentiment = sqliteTable(
  "market_sentiment",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    timestamp: text("timestamp").notNull(),
    score: integer("score").notNull(), // 0 to 100
    classification: text("classification").notNull(), // Extreme Fear, Fear, Neutral, Greed, Extreme Greed
    assetClass: text("asset_class").notNull().default("crypto"),
    source: text("source").notNull().default("Alternative.me"),
  },
  (table) => [
    index("sentiment_timestamp_idx").on(table.timestamp),
    uniqueIndex("sentiment_timestamp_unique").on(table.timestamp, table.assetClass),
  ]
);

