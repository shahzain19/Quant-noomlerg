# ATLAS — Financial Intelligence Terminal

A fully local, Bloomberg-inspired financial intelligence terminal for beginners and serious users. Explore financial markets, companies, prices, financial statements, economic indicators, news/events, charts, watchlists, and AI-style explanations from one clean interface.

**No cloud infrastructure. No accounts. No hosted databases. Runs entirely on your machine.**

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup

The SQLite database lives at `data/terminal.db` and is created automatically on first seed.

```bash
# Seed the database with demo data (10 companies, indices, FX, commodities, crypto)
npm run db:seed

# Push schema changes (after editing schema.ts)
npm run db:push

# Open Drizzle Studio for visual DB inspection
npm run db:studio
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to SQLite |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Drizzle Studio |

## Importing Data

Navigate to the **Data Center** page (`/data`) to import CSV or JSON datasets:

- **Companies** — ticker, name, exchange, sector, industry, country, description, website
- **Prices** — symbol, timestamp, open, high, low, close, volume
- **Economic** — name, country, timestamp, value, unit, source, category
- **News** — title, summary, source, url, published_at, related_symbol

All imports are validated, logged, and stored in SQLite with transactions.

## Architecture

```
src/
  app/                  # Next.js pages + API routes
    api/                # 14 internal API endpoints
    companies/          # Company listing + detail pages
    markets/            # Market explorer
    watchlist/          # Watchlist management
    news/               # News feed
    economy/            # Economic indicators
    screener/           # Stock screener
    data/               # Data import center
    settings/           # App settings
  components/
    layout/             # Sidebar, command palette, app shell
    dashboard/          # Dashboard widgets
    company/            # Company detail view
    markets/            # Market explorer
    watchlist/          # Watchlist management
    news/               # News feed
    economy/            # Economic indicators
    screener/           # Stock screener
    data/               # Data import
    settings/           # Settings
    charts/             # Price chart + sparkline (Recharts)
    explanations/       # Metric explanations + explain button
    ui/                 # Panel, DemoBadge, NoData, etc.
  lib/
    db/                 # Drizzle schema, SQLite connection, seed
    providers/          # MarketDataProvider (DB-backed)
    services/           # Search, screener, watchlists, settings, import
    explanations/       # Explanation engine + metric explanations
    calculations/       # Financial calculation functions
  types/                # TypeScript interfaces
```

## Adding a New Market Data Provider

The app uses a provider abstraction. To add a new data source:

1. Create `src/lib/providers/your-provider.ts`
2. Implement the `MarketDataProvider` interface from `src/types/index.ts`
3. Swap the provider in API routes or create an adapter layer

```typescript
interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote | null>;
  getHistoricalPrices(symbol: string, range: ChartRange): Promise<PricePoint[]>;
  getCompany(symbol: string): Promise<CompanyDetail | null>;
  getFinancials(symbol: string, periodType?: PeriodType): Promise<FinancialStatement[]>;
}
```

## Demo Data

All data in the default seed is **synthetic demo data** clearly labeled throughout the UI. The seed includes:

- **10 companies**: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, NFLX, AMD, JPM
- **3 indices**: S&P 500, NASDAQ Composite, Dow Jones
- **4 currencies**: USD/PKR, EUR/USD, GBP/USD, USD/JPY
- **3 commodities**: Gold, Silver, Crude Oil
- **1 crypto**: Bitcoin
- **~18,900 price records** with historical OHLCV data
- **Financial statements** (annual + quarterly) for each company
- **Economic indicators**: CPI, unemployment, GDP, Fed funds rate, USD index, oil, gold
- **News articles** and **company events**

## Tech Stack

- **Next.js 16** (React 19, TypeScript)
- **Tailwind CSS v4** (dark theme)
- **SQLite** via better-sqlite3
- **Drizzle ORM** for database access
- **Recharts** for charts
- **cmdk** for command palette
- **Zod** for validation
- **Vitest** for testing
