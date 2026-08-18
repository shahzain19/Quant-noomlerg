import { getDb, getSqlite } from "./index";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

const COMPANIES = [
  {
    name: "Apple Inc.",
    ticker: "AAPL",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Consumer Electronics",
    description:
      "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
    website: "https://www.apple.com",
    basePrice: 212.43,
    marketCap: 3.1e12,
    peRatio: 31.2,
    eps: 6.8,
    revenue: 391e9,
    netMargin: 24.1,
    revenueGrowth: 8.5,
    dividendYield: 0.44,
    debt: 95e9,
    beta: 1.25,
    sharesOutstanding: 15.5e9,
  },
  {
    name: "Microsoft Corporation",
    ticker: "MSFT",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Software",
    description: "Microsoft develops and supports software, services, devices, and solutions worldwide.",
    website: "https://www.microsoft.com",
    basePrice: 425.5,
    marketCap: 3.15e12,
    peRatio: 35.8,
    eps: 11.89,
    revenue: 245e9,
    netMargin: 35.2,
    revenueGrowth: 14.2,
    dividendYield: 0.72,
    debt: 60e9,
    beta: 0.91,
    sharesOutstanding: 7.43e9,
  },
  {
    name: "NVIDIA Corporation",
    ticker: "NVDA",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Semiconductors",
    description: "NVIDIA provides graphics, compute and networking solutions for gaming, data centers, and AI.",
    website: "https://www.nvidia.com",
    basePrice: 118.75,
    marketCap: 2.9e12,
    peRatio: 55.4,
    eps: 2.14,
    revenue: 96e9,
    netMargin: 48.5,
    revenueGrowth: 122.0,
    dividendYield: 0.03,
    debt: 8.5e9,
    beta: 1.68,
    sharesOutstanding: 24.5e9,
  },
  {
    name: "Alphabet Inc.",
    ticker: "GOOGL",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Internet Services",
    description: "Alphabet offers various products and platforms including Search, Maps, YouTube, and Cloud.",
    website: "https://abc.xyz",
    basePrice: 178.2,
    marketCap: 2.2e12,
    peRatio: 26.5,
    eps: 6.72,
    revenue: 328e9,
    netMargin: 28.4,
    revenueGrowth: 13.8,
    dividendYield: 0.48,
    debt: 25e9,
    beta: 1.05,
    sharesOutstanding: 12.4e9,
  },
  {
    name: "Amazon.com Inc.",
    ticker: "AMZN",
    exchange: "NASDAQ",
    sector: "Consumer Cyclical",
    industry: "E-Commerce",
    description: "Amazon engages in retail sale of consumer products, cloud computing, and digital streaming.",
    website: "https://www.amazon.com",
    basePrice: 195.8,
    marketCap: 2.05e12,
    peRatio: 42.1,
    eps: 4.65,
    revenue: 638e9,
    netMargin: 8.2,
    revenueGrowth: 11.5,
    dividendYield: 0,
    debt: 135e9,
    beta: 1.18,
    sharesOutstanding: 10.5e9,
  },
  {
    name: "Meta Platforms Inc.",
    ticker: "META",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Social Media",
    description: "Meta develops products that enable people to connect through mobile devices and personal computers.",
    website: "https://about.meta.com",
    basePrice: 520.3,
    marketCap: 1.32e12,
    peRatio: 27.8,
    eps: 18.72,
    revenue: 158e9,
    netMargin: 34.8,
    revenueGrowth: 22.1,
    dividendYield: 0.35,
    debt: 28e9,
    beta: 1.22,
    sharesOutstanding: 2.54e9,
  },
  {
    name: "Tesla Inc.",
    ticker: "TSLA",
    exchange: "NASDAQ",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    description: "Tesla designs, develops, manufactures, and sells electric vehicles and energy products.",
    website: "https://www.tesla.com",
    basePrice: 248.5,
    marketCap: 790e9,
    peRatio: 68.2,
    eps: 3.64,
    revenue: 97e9,
    netMargin: 12.5,
    revenueGrowth: 5.2,
    dividendYield: 0,
    debt: 5.5e9,
    beta: 2.05,
    sharesOutstanding: 3.18e9,
  },
  {
    name: "Netflix Inc.",
    ticker: "NFLX",
    exchange: "NASDAQ",
    sector: "Communication Services",
    industry: "Entertainment",
    description: "Netflix provides entertainment services including TV series, documentaries, and feature films.",
    website: "https://www.netflix.com",
    basePrice: 685.2,
    marketCap: 295e9,
    peRatio: 44.5,
    eps: 15.4,
    revenue: 39e9,
    netMargin: 22.1,
    revenueGrowth: 15.8,
    dividendYield: 0,
    debt: 14e9,
    beta: 1.35,
    sharesOutstanding: 430e6,
  },
  {
    name: "Advanced Micro Devices Inc.",
    ticker: "AMD",
    exchange: "NASDAQ",
    sector: "Technology",
    industry: "Semiconductors",
    description: "AMD operates as a semiconductor company worldwide.",
    website: "https://www.amd.com",
    basePrice: 162.4,
    marketCap: 262e9,
    peRatio: 48.2,
    eps: 3.37,
    revenue: 26e9,
    netMargin: 10.8,
    revenueGrowth: 18.5,
    dividendYield: 0,
    debt: 1.7e9,
    beta: 1.72,
    sharesOutstanding: 1.62e9,
  },
  {
    name: "JPMorgan Chase & Co.",
    ticker: "JPM",
    exchange: "NYSE",
    sector: "Financial Services",
    industry: "Banks",
    description: "JPMorgan Chase operates as a financial services company worldwide.",
    website: "https://www.jpmorganchase.com",
    basePrice: 215.8,
    marketCap: 620e9,
    peRatio: 12.5,
    eps: 17.26,
    revenue: 158e9,
    netMargin: 32.5,
    revenueGrowth: 9.2,
    dividendYield: 2.1,
    debt: 420e9,
    beta: 1.08,
    sharesOutstanding: 2.87e9,
  },
];

const INDICES = [
  { symbol: "SPX", name: "S&P 500", basePrice: 5470.0 },
  { symbol: "IXIC", name: "NASDAQ Composite", basePrice: 17850.0 },
  { symbol: "DJI", name: "Dow Jones Industrial Average", basePrice: 39800.0 },
];

const CURRENCIES = [
  { symbol: "USD/PKR", name: "US Dollar / Pakistani Rupee", basePrice: 278.5 },
  { symbol: "EUR/USD", name: "Euro / US Dollar", basePrice: 1.085 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", basePrice: 1.272 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", basePrice: 149.2 },
];

const COMMODITIES = [
  { symbol: "GOLD", name: "Gold", basePrice: 2425.0 },
  { symbol: "SILVER", name: "Silver", basePrice: 28.5 },
  { symbol: "OIL", name: "Crude Oil (WTI)", basePrice: 78.2 },
];

const CRYPTO = [{ symbol: "BTC", name: "Bitcoin", basePrice: 67500.0 }];

function nowISO() {
  return new Date().toISOString();
}

function generatePrices(basePrice: number, days: number, volatility = 0.02): Array<{
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}> {
  const prices = [];
  let price = basePrice * (1 - volatility * days * 0.1);
  const start = new Date();
  start.setFullYear(start.getFullYear() - Math.ceil(days / 365));
  start.setHours(16, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor(10e6 + Math.random() * 50e6);

    prices.push({
      timestamp: d.toISOString(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    price = close;
  }
  return prices;
}

function createTables() {
  const sqlite = getSqlite();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ticker TEXT NOT NULL UNIQUE,
      exchange TEXT NOT NULL,
      sector TEXT,
      industry TEXT,
      country TEXT DEFAULT 'US',
      description TEXT,
      website TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS securities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id),
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      exchange TEXT,
      market_cap REAL,
      pe_ratio REAL,
      eps REAL,
      revenue REAL,
      net_margin REAL,
      revenue_growth REAL,
      dividend_yield REAL,
      debt REAL,
      beta REAL,
      price_to_sales REAL,
      price_to_book REAL,
      ev_to_ebitda REAL,
      high_52w REAL,
      low_52w REAL,
      shares_outstanding REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      security_id INTEGER NOT NULL REFERENCES securities(id),
      timestamp TEXT NOT NULL,
      open REAL NOT NULL,
      high REAL NOT NULL,
      low REAL NOT NULL,
      close REAL NOT NULL,
      volume REAL,
      UNIQUE(security_id, timestamp)
    );

    CREATE INDEX IF NOT EXISTS prices_security_timestamp_idx ON prices(security_id, timestamp);

    CREATE TABLE IF NOT EXISTS financial_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      period TEXT NOT NULL,
      period_type TEXT NOT NULL,
      revenue REAL, cost_of_revenue REAL, gross_profit REAL,
      operating_income REAL, net_income REAL, eps REAL,
      assets REAL, liabilities REAL, equity REAL,
      cash REAL, debt REAL,
      operating_cash_flow REAL, capex REAL, free_cash_flow REAL,
      UNIQUE(company_id, period, period_type)
    );

    CREATE TABLE IF NOT EXISTS economic_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, country TEXT NOT NULL,
      timestamp TEXT NOT NULL, value REAL NOT NULL,
      unit TEXT, source TEXT, category TEXT
    );

    CREATE INDEX IF NOT EXISTS economic_name_timestamp_idx ON economic_indicators(name, timestamp);

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, summary TEXT, source TEXT, url TEXT,
      published_at TEXT NOT NULL,
      related_company_id INTEGER REFERENCES companies(id),
      related_symbol TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, title TEXT NOT NULL,
      description TEXT, date TEXT NOT NULL,
      company_id INTEGER REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
      security_id INTEGER NOT NULL REFERENCES securities(id),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(watchlist_id, security_id)
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, type TEXT NOT NULL,
      last_import_at TEXT, records_imported INTEGER DEFAULT 0,
      records_rejected INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_type TEXT NOT NULL,
      records_imported INTEGER DEFAULT 0,
      records_rejected INTEGER DEFAULT 0,
      imported_at TEXT NOT NULL,
      filename TEXT
    );

    CREATE TABLE IF NOT EXISTS filings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id),
      ticker TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT,
      filed_at TEXT NOT NULL,
      source TEXT DEFAULT 'SEC EDGAR'
    );

    CREATE TABLE IF NOT EXISTS insider_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id),
      ticker TEXT NOT NULL,
      insider_name TEXT NOT NULL,
      title TEXT,
      transaction_type TEXT NOT NULL,
      shares REAL,
      price REAL,
      total_value REAL,
      filed_at TEXT NOT NULL,
      source TEXT DEFAULT 'SEC EDGAR'
    );

    CREATE TABLE IF NOT EXISTS yield_curve (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      maturity TEXT NOT NULL,
      yield_value REAL NOT NULL,
      spread_vs_10y REAL,
      source TEXT DEFAULT 'US Treasury'
    );

    CREATE TABLE IF NOT EXISTS macro_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT,
      importance TEXT DEFAULT 'high',
      source TEXT
    );

    CREATE TABLE IF NOT EXISTS market_sentiment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      score INTEGER NOT NULL,
      classification TEXT NOT NULL,
      asset_class TEXT NOT NULL DEFAULT 'crypto',
      source TEXT NOT NULL DEFAULT 'Alternative.me'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS sentiment_timestamp_unique ON market_sentiment(timestamp, asset_class);
  `);
}

export async function seedDatabase(force = false) {
  createTables();
  const db = getDb();
  const sqlite = getSqlite();

  const existing = sqlite.prepare("SELECT COUNT(*) as c FROM companies").get() as { c: number };
  if (existing.c > 0 && !force) {
    console.log("Database already seeded. Use force=true to reseed.");
    return;
  }

  if (force) {
    sqlite.exec(`
      DELETE FROM watchlist_items;
      DELETE FROM watchlists;
      DELETE FROM prices;
      DELETE FROM financial_statements;
      DELETE FROM news;
      DELETE FROM events;
      DELETE FROM securities;
      DELETE FROM companies;
      DELETE FROM economic_indicators;
      DELETE FROM import_logs;
      DELETE FROM settings;
      DELETE FROM filings;
      DELETE FROM insider_transactions;
      DELETE FROM yield_curve;
      DELETE FROM macro_events;
      DELETE FROM market_sentiment;
    `);
  }


  const ts = nowISO();
  const securityIds: Record<string, number> = {};

  for (const c of COMPANIES) {
    const [company] = await db
      .insert(schema.companies)
      .values({
        name: c.name,
        ticker: c.ticker,
        exchange: c.exchange,
        sector: c.sector,
        industry: c.industry,
        country: "US",
        description: c.description,
        website: c.website,
        createdAt: ts,
        updatedAt: ts,
      })
      .returning();

    const high52 = c.basePrice * 1.15;
    const low52 = c.basePrice * 0.75;

    const [sec] = await db
      .insert(schema.securities)
      .values({
        companyId: company.id,
        symbol: c.ticker,
        name: c.name,
        assetType: "equity",
        currency: "USD",
        exchange: c.exchange,
        marketCap: c.marketCap,
        peRatio: c.peRatio,
        eps: c.eps,
        revenue: c.revenue,
        netMargin: c.netMargin,
        revenueGrowth: c.revenueGrowth,
        dividendYield: c.dividendYield,
        debt: c.debt,
        beta: c.beta,
        priceToSales: c.marketCap / c.revenue,
        priceToBook: 8 + Math.random() * 20,
        evToEbitda: c.peRatio * 0.8,
        high52w: high52,
        low52w: low52,
        sharesOutstanding: c.sharesOutstanding,
        createdAt: ts,
        updatedAt: ts,
      })
      .returning();

    securityIds[c.ticker] = sec.id;

    const priceData = generatePrices(c.basePrice, 1260, 0.025);
    const batchSize = 100;
    for (let i = 0; i < priceData.length; i += batchSize) {
      const batch = priceData.slice(i, i + batchSize).map((p) => ({
        securityId: sec.id,
        ...p,
      }));
      await db.insert(schema.prices).values(batch);
    }

    for (let year = 2021; year <= 2024; year++) {
      const growth = 1 + (year - 2021) * 0.08;
      const rev = c.revenue * (0.7 + (year - 2021) * 0.1);
      const gross = rev * 0.42;
      const opInc = rev * 0.28;
      const netInc = rev * (c.netMargin / 100);
      await db.insert(schema.financialStatements).values({
        companyId: company.id,
        period: String(year),
        periodType: "annual",
        revenue: rev,
        costOfRevenue: rev - gross,
        grossProfit: gross,
        operatingIncome: opInc,
        netIncome: netInc,
        eps: c.eps * growth * 0.9,
        assets: rev * 1.2,
        liabilities: rev * 0.5,
        equity: rev * 0.7,
        cash: rev * 0.15,
        debt: c.debt,
        operatingCashFlow: netInc * 1.3,
        capex: rev * 0.05,
        freeCashFlow: netInc * 1.1,
      });
    }

    for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
      const rev = c.revenue / 4;
      await db.insert(schema.financialStatements).values({
        companyId: company.id,
        period: `2024-${q}`,
        periodType: "quarterly",
        revenue: rev,
        costOfRevenue: rev * 0.58,
        grossProfit: rev * 0.42,
        operatingIncome: rev * 0.28,
        netIncome: rev * (c.netMargin / 100),
        eps: c.eps / 4,
        assets: c.revenue * 1.2,
        liabilities: c.revenue * 0.5,
        equity: c.revenue * 0.7,
        cash: c.revenue * 0.04,
        debt: c.debt,
        operatingCashFlow: rev * 0.3,
        capex: rev * 0.05,
        freeCashFlow: rev * 0.22,
      });
    }
  }

  const marketAssets = [
    ...INDICES.map((i) => ({ ...i, assetType: "index" as const, exchange: "INDEX" })),
    ...CURRENCIES.map((c) => ({ ...c, assetType: "currency" as const, exchange: "FX" })),
    ...COMMODITIES.map((c) => ({ ...c, assetType: "commodity" as const, exchange: "COMEX" })),
    ...CRYPTO.map((c) => ({ ...c, assetType: "crypto" as const, exchange: "CRYPTO" })),
  ];

  for (const asset of marketAssets) {
    const [sec] = await db
      .insert(schema.securities)
      .values({
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        currency: "USD",
        exchange: asset.exchange,
        createdAt: ts,
        updatedAt: ts,
      })
      .returning();

    securityIds[asset.symbol] = sec.id;
    const vol = asset.assetType === "crypto" ? 0.04 : asset.assetType === "currency" ? 0.005 : 0.015;
    const priceData = generatePrices(asset.basePrice, 1260, vol);
    const batchSize = 100;
    for (let i = 0; i < priceData.length; i += batchSize) {
      const batch = priceData.slice(i, i + batchSize).map((p) => ({
        securityId: sec.id,
        ...p,
      }));
      await db.insert(schema.prices).values(batch);
    }
  }

  const newsItems = [
    {
      title: "Apple reports strong iPhone sales in latest quarter",
      summary: "Apple exceeded analyst expectations with robust iPhone and services revenue growth.",
      symbol: "AAPL",
    },
    {
      title: "NVIDIA demand for AI chips continues to surge",
      summary: "Data center revenue reached new records as AI infrastructure spending accelerates.",
      symbol: "NVDA",
    },
    {
      title: "Federal Reserve holds rates steady, signals cautious approach",
      summary: "The Fed maintained its benchmark rate while monitoring inflation trends.",
      symbol: null,
    },
    {
      title: "Tesla deliveries miss estimates amid competitive pressure",
      summary: "Electric vehicle deliveries came in below Wall Street expectations for the quarter.",
      symbol: "TSLA",
    },
    {
      title: "Microsoft Azure cloud growth beats forecasts",
      summary: "Enterprise cloud adoption drove double-digit revenue growth for Microsoft's cloud division.",
      symbol: "MSFT",
    },
    {
      title: "Oil prices rise on supply concerns",
      summary: "Crude oil futures climbed as geopolitical tensions raised supply uncertainty.",
      symbol: "OIL",
    },
    {
      title: "Gold hits new highs amid safe-haven demand",
      summary: "Precious metals rallied as investors sought protection from market volatility.",
      symbol: "GOLD",
    },
    {
      title: "Meta announces new AI features for social platforms",
      summary: "The company unveiled AI-powered tools for content creation and ad targeting.",
      symbol: "META",
    },
  ];

  for (let i = 0; i < newsItems.length; i++) {
    const item = newsItems[i];
    let companyId = null;
    if (item.symbol) {
      const comp = await db.query.companies.findFirst({
        where: (c, { eq }) => eq(c.ticker, item.symbol!),
      });
      companyId = comp?.id ?? null;
    }
    const pubDate = new Date();
    pubDate.setDate(pubDate.getDate() - i);
    await db.insert(schema.news).values({
      title: item.title,
      summary: item.summary,
      source: "ATLAS Demo Feed",
      url: null,
      publishedAt: pubDate.toISOString(),
      relatedCompanyId: companyId,
      relatedSymbol: item.symbol,
    });
  }

  const aapl = await db.query.companies.findFirst({ where: (c, { eq }) => eq(c.ticker, "AAPL") });
  if (aapl) {
    await db.insert(schema.events).values([
      {
        type: "earnings",
        title: "Q4 2024 Earnings Release",
        description: "Apple scheduled to report quarterly results after market close.",
        date: "2024-10-31",
        companyId: aapl.id,
      },
      {
        type: "product",
        title: "iPhone 16 Launch Event",
        description: "Apple unveiled new iPhone models with enhanced AI capabilities.",
        date: "2024-09-09",
        companyId: aapl.id,
      },
    ]);
  }

  const economicData = [
    { name: "CPI (Inflation)", category: "inflation", unit: "%", values: [3.2, 3.1, 3.0, 2.9, 2.8, 2.7] },
    { name: "Unemployment Rate", category: "employment", unit: "%", values: [3.8, 3.7, 3.9, 3.8, 3.7, 3.6] },
    { name: "GDP Growth", category: "gdp", unit: "%", values: [2.1, 2.4, 2.8, 2.5, 2.3, 2.6] },
    { name: "Fed Funds Rate", category: "rates", unit: "%", values: [5.25, 5.25, 5.0, 4.75, 4.5, 4.25] },
    { name: "USD Index", category: "fx", unit: "index", values: [103.5, 104.2, 103.8, 104.5, 105.0, 104.8] },
    { name: "WTI Crude Oil", category: "commodities", unit: "$/bbl", values: [75.2, 76.8, 78.2, 77.5, 79.1, 78.2] },
    { name: "Gold Spot", category: "commodities", unit: "$/oz", values: [2350, 2380, 2400, 2410, 2425, 2425] },
  ];

  for (const ind of economicData) {
    for (let m = 0; m < ind.values.length; m++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (ind.values.length - 1 - m));
      await db.insert(schema.economicIndicators).values({
        name: ind.name,
        country: "US",
        timestamp: d.toISOString(),
        value: ind.values[m],
        unit: ind.unit,
        source: "ATLAS Demo",
        category: ind.category,
      });
    }
  }

  // Seed World Bank Global Economic Indicators
  const worldBankSeed = [
    { name: "EMU Real GDP Growth", country: "EMU", value: 0.8, unit: "%", category: "gdp" },
    { name: "CN Real GDP Growth", country: "CN", value: 5.2, unit: "%", category: "gdp" },
    { name: "JP Real GDP Growth", country: "JP", value: 1.9, unit: "%", category: "gdp" },
    { name: "GB Real GDP Growth", country: "GB", value: 0.5, unit: "%", category: "gdp" },
    { name: "IN Real GDP Growth", country: "IN", value: 7.8, unit: "%", category: "gdp" },
    { name: "EMU Consumer Inflation", country: "EMU", value: 2.6, unit: "%", category: "inflation" },
    { name: "CN Consumer Inflation", country: "CN", value: 0.3, unit: "%", category: "inflation" },
    { name: "JP Consumer Inflation", country: "JP", value: 3.2, unit: "%", category: "inflation" },
    { name: "GB Consumer Inflation", country: "GB", value: 3.8, unit: "%", category: "inflation" },
  ];

  for (const wb of worldBankSeed) {
    const d = new Date();
    await db.insert(schema.economicIndicators).values({
      name: wb.name,
      country: wb.country,
      timestamp: d.toISOString(),
      value: wb.value,
      unit: wb.unit,
      source: "World Bank",
      category: wb.category,
    });
  }

  // Seed Market Sentiment History (Fear & Greed)
  const sentimentSeed = [
    { daysAgo: 0, score: 68, classification: "Greed" },
    { daysAgo: 1, score: 65, classification: "Greed" },
    { daysAgo: 2, score: 72, classification: "Greed" },
    { daysAgo: 3, score: 78, classification: "Extreme Greed" },
    { daysAgo: 4, score: 55, classification: "Greed" },
    { daysAgo: 5, score: 48, classification: "Neutral" },
    { daysAgo: 6, score: 42, classification: "Fear" },
  ];

  for (const s of sentimentSeed) {
    const d = new Date();
    d.setDate(d.getDate() - s.daysAgo);
    await db.insert(schema.marketSentiment).values({
      timestamp: d.toISOString(),
      score: s.score,
      classification: s.classification,
      assetClass: "crypto",
      source: "Alternative.me",
    }).onConflictDoNothing();
  }

  const [watchlist] = await db
    .insert(schema.watchlists)
    .values({ name: "US Tech", createdAt: ts })
    .returning();

  const techSymbols = ["AAPL", "MSFT", "NVDA", "GOOGL", "META"];
  for (let i = 0; i < techSymbols.length; i++) {
    const secId = securityIds[techSymbols[i]];
    if (secId) {
      await db.insert(schema.watchlistItems).values({
        watchlistId: watchlist.id,
        securityId: secId,
        sortOrder: i,
        createdAt: ts,
      });
    }
  }

  await db.insert(schema.settings).values([
    { key: "theme", value: "dark" },
    { key: "density", value: "compact" },
    { key: "uiMode", value: "explorer" },
    { key: "defaultWatchlistId", value: String(watchlist.id) },
    { key: "defaultChartRange", value: "1M" },
  ]);

  await db.insert(schema.dataSources).values([
    {
      name: "ATLAS Demo Seed",
      type: "seed",
      lastImportAt: ts,
      recordsImported: Object.keys(securityIds).length,
      recordsRejected: 0,
    },
    {
      name: "World Bank",
      type: "economic",
      lastImportAt: ts,
      recordsImported: worldBankSeed.length,
      recordsRejected: 0,
    },
    {
      name: "Alternative.me",
      type: "sentiment",
      lastImportAt: ts,
      recordsImported: sentimentSeed.length,
      recordsRejected: 0,
    },
  ]);


  const priceCount = sqlite.prepare("SELECT COUNT(*) as c FROM prices").get() as { c: number };
  console.log(`✓ Seeded ${COMPANIES.length} companies, ${Object.keys(securityIds).length} securities`);
  console.log(`✓ Generated ${priceCount.c.toLocaleString()} price records`);
  console.log("✓ Database ready at data/terminal.db");
}

if (require.main === module) {
  const force = process.argv.includes("--force");
  seedDatabase(force)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
