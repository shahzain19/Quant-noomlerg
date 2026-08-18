import { getDb, getSqlite } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nowISO } from "@/lib/utils";
import type {
  NormalizedCompany,
  NormalizedPrice,
  NormalizedFinancial,
  NormalizedEconomicIndicator,
  NormalizedNews,
  SyncResult,
} from "@/lib/providers/adapters/types";

type DrizzleDB = ReturnType<typeof getDb>;

export async function upsertCompany(
  db: DrizzleDB,
  data: NormalizedCompany
): Promise<{ companyId: number; securityId: number; action: "inserted" | "updated" }> {
  const sqlite = getSqlite();
  const ts = nowISO();

  // Check if company exists
  const existingCompany = sqlite
    .prepare("SELECT id FROM companies WHERE ticker = ?")
    .get(data.ticker) as { id: number } | undefined;

  let companyId: number;
  let action: "inserted" | "updated";

  if (existingCompany) {
    companyId = existingCompany.id;
    action = "updated";

    // Update company
    sqlite
      .prepare(
        `UPDATE companies SET
          name = ?, exchange = ?, sector = ?, industry = ?,
          country = ?, description = ?, website = ?, updated_at = ?
        WHERE id = ?`
      )
      .run(
        data.name,
        data.exchange,
        data.sector,
        data.industry,
        data.country,
        data.description,
        data.website,
        ts,
        companyId
      );
  } else {
    const result = sqlite
      .prepare(
        `INSERT INTO companies (name, ticker, exchange, sector, industry, country, description, website, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.name,
        data.ticker,
        data.exchange,
        data.sector,
        data.industry,
        data.country,
        data.description,
        data.website,
        ts,
        ts
      );
    companyId = result.lastInsertRowid as number;
    action = "inserted";
  }

  // Check if security exists
  const existingSecurity = sqlite
    .prepare("SELECT id FROM securities WHERE symbol = ?")
    .get(data.ticker) as { id: number } | undefined;

  let securityId: number;

  if (existingSecurity) {
    securityId = existingSecurity.id;

    // Update security
    sqlite
      .prepare(
        `UPDATE securities SET
          company_id = ?, name = ?, exchange = ?, market_cap = ?, pe_ratio = ?,
          eps = ?, revenue = ?, net_margin = ?, revenue_growth = ?,
          dividend_yield = ?, debt = ?, beta = ?, price_to_sales = ?,
          price_to_book = ?, ev_to_ebitda = ?, high_52w = ?, low_52w = ?,
          shares_outstanding = ?, updated_at = ?
        WHERE id = ?`
      )
      .run(
        companyId,
        data.name,
        data.exchange,
        data.marketCap,
        data.peRatio,
        data.eps,
        data.revenue,
        data.netMargin,
        data.revenueGrowth,
        data.dividendYield,
        data.debt,
        data.beta,
        data.priceToSales,
        data.priceToBook,
        data.evToEbitda,
        data.high52w,
        data.low52w,
        data.sharesOutstanding,
        ts,
        securityId
      );
  } else {
    const result = sqlite
      .prepare(
        `INSERT INTO securities (
          company_id, symbol, name, asset_type, currency, exchange,
          market_cap, pe_ratio, eps, revenue, net_margin, revenue_growth,
          dividend_yield, debt, beta, price_to_sales, price_to_book,
          ev_to_ebitda, high_52w, low_52w, shares_outstanding,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        companyId,
        data.ticker,
        data.name,
        "equity",
        "USD",
        data.exchange,
        data.marketCap,
        data.peRatio,
        data.eps,
        data.revenue,
        data.netMargin,
        data.revenueGrowth,
        data.dividendYield,
        data.debt,
        data.beta,
        data.priceToSales,
        data.priceToBook,
        data.evToEbitda,
        data.high52w,
        data.low52w,
        data.sharesOutstanding,
        ts,
        ts
      );
    securityId = result.lastInsertRowid as number;
  }

  return { companyId, securityId, action };
}

export function upsertPrice(
  db: DrizzleDB,
  securityId: number,
  data: NormalizedPrice
): void {
  const sqlite = getSqlite();
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO prices (security_id, timestamp, open, high, low, close, volume)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(securityId, data.timestamp, data.open, data.high, data.low, data.close, data.volume);
}

export function upsertPricesBulk(
  db: DrizzleDB,
  securityId: number,
  prices: NormalizedPrice[]
): { inserted: number; skipped: number } {
  const sqlite = getSqlite();
  let inserted = 0;
  let skipped = 0;

  const insertStmt = sqlite.prepare(
    `INSERT OR IGNORE INTO prices (security_id, timestamp, open, high, low, close, volume)
    VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const transaction = sqlite.transaction(() => {
    const BATCH_SIZE = 500;
    for (let i = 0; i < prices.length; i += BATCH_SIZE) {
      const batch = prices.slice(i, i + BATCH_SIZE);
      for (const p of batch) {
        const result = insertStmt.run(
          securityId,
          p.timestamp,
          p.open,
          p.high,
          p.low,
          p.close,
          p.volume
        );
        if (result.changes > 0) {
          inserted++;
        } else {
          skipped++;
        }
      }
    }
  });

  transaction();
  return { inserted, skipped };
}

export function upsertFinancial(
  db: DrizzleDB,
  data: NormalizedFinancial
): { companyId: number | null; action: "inserted" | "updated" | "skipped" } {
  const sqlite = getSqlite();
  const ts = nowISO();

  const existingCompany = sqlite
    .prepare("SELECT id FROM companies WHERE ticker = ?")
    .get(data.ticker) as { id: number } | undefined;

  if (!existingCompany) {
    return { companyId: null, action: "skipped" };
  }

  const companyId = existingCompany.id;

  const existing = sqlite
    .prepare(
      "SELECT id FROM financial_statements WHERE company_id = ? AND period = ? AND period_type = ?"
    )
    .get(companyId, data.period, data.periodType) as { id: number } | undefined;

  if (existing) {
    sqlite
      .prepare(
        `UPDATE financial_statements SET
          revenue = ?, cost_of_revenue = ?, gross_profit = ?,
          operating_income = ?, net_income = ?, eps = ?,
          assets = ?, liabilities = ?, equity = ?,
          cash = ?, debt = ?,
          operating_cash_flow = ?, capex = ?, free_cash_flow = ?
        WHERE id = ?`
      )
      .run(
        data.revenue,
        data.costOfRevenue,
        data.grossProfit,
        data.operatingIncome,
        data.netIncome,
        data.eps,
        data.assets,
        data.liabilities,
        data.equity,
        data.cash,
        data.debt,
        data.operatingCashFlow,
        data.capex,
        data.freeCashFlow,
        existing.id
      );
    return { companyId, action: "updated" };
  } else {
    sqlite
      .prepare(
        `INSERT INTO financial_statements (
          company_id, period, period_type,
          revenue, cost_of_revenue, gross_profit,
          operating_income, net_income, eps,
          assets, liabilities, equity,
          cash, debt,
          operating_cash_flow, capex, free_cash_flow
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        companyId,
        data.period,
        data.periodType,
        data.revenue,
        data.costOfRevenue,
        data.grossProfit,
        data.operatingIncome,
        data.netIncome,
        data.eps,
        data.assets,
        data.liabilities,
        data.equity,
        data.cash,
        data.debt,
        data.operatingCashFlow,
        data.capex,
        data.freeCashFlow
      );
    return { companyId, action: "inserted" };
  }
}

export function upsertEconomicIndicator(
  db: DrizzleDB,
  data: NormalizedEconomicIndicator
): { action: "inserted" | "skipped" } {
  const sqlite = getSqlite();

  // Check for existing entry (same name + timestamp)
  const existing = sqlite
    .prepare(
      "SELECT id FROM economic_indicators WHERE name = ? AND timestamp = ?"
    )
    .get(data.name, data.timestamp) as { id: number } | undefined;

  if (existing) {
    return { action: "skipped" };
  }

  sqlite
    .prepare(
      `INSERT INTO economic_indicators (name, country, timestamp, value, unit, source, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.name,
      data.country,
      data.timestamp,
      data.value,
      data.unit,
      data.source,
      data.category
    );

  return { action: "inserted" };
}

export function upsertNewsItem(
  db: DrizzleDB,
  data: NormalizedNews
): { action: "inserted" | "skipped" } {
  const sqlite = getSqlite();

  // Dedup by title + publishedAt
  const existing = sqlite
    .prepare(
      "SELECT id FROM news WHERE title = ? AND published_at = ?"
    )
    .get(data.title, data.publishedAt) as { id: number } | undefined;

  if (existing) {
    return { action: "skipped" };
  }

  // Find related company
  let relatedCompanyId: number | null = null;
  if (data.relatedSymbol) {
    const company = sqlite
      .prepare("SELECT id FROM companies WHERE ticker = ?")
      .get(data.relatedSymbol) as { id: number } | undefined;
    relatedCompanyId = company?.id ?? null;
  }

  sqlite
    .prepare(
      `INSERT INTO news (title, summary, source, url, published_at, related_company_id, related_symbol)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.title,
      data.summary,
      data.source,
      data.url,
      data.publishedAt,
      relatedCompanyId,
      data.relatedSymbol
    );

  return { action: "inserted" };
}

export function upsertCryptoCompany(
  db: DrizzleDB,
  data: NormalizedCompany
): { companyId: number; securityId: number; action: "inserted" | "updated" } {
  const sqlite = getSqlite();
  const ts = nowISO();

  // Upsert company
  const existingCompany = sqlite
    .prepare("SELECT id FROM companies WHERE ticker = ?")
    .get(data.ticker) as { id: number } | undefined;

  let companyId: number;
  let action: "inserted" | "updated";

  if (existingCompany) {
    companyId = existingCompany.id;
    action = "updated";

    sqlite
      .prepare(
        `UPDATE companies SET name = ?, exchange = ?, sector = ?, industry = ?, updated_at = ?
        WHERE id = ?`
      )
      .run(data.name, data.exchange, data.sector, data.industry, ts, companyId);
  } else {
    const result = sqlite
      .prepare(
        `INSERT INTO companies (name, ticker, exchange, sector, industry, country, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(data.name, data.ticker, data.exchange, data.sector, data.industry, null, ts, ts);
    companyId = result.lastInsertRowid as number;
    action = "inserted";
  }

  // Upsert security with crypto asset type
  const existingSecurity = sqlite
    .prepare("SELECT id FROM securities WHERE symbol = ?")
    .get(data.ticker) as { id: number } | undefined;

  let securityId: number;

  if (existingSecurity) {
    securityId = existingSecurity.id;

    sqlite
      .prepare(
        `UPDATE securities SET
          company_id = ?, name = ?, asset_type = ?, exchange = ?,
          market_cap = ?, shares_outstanding = ?, updated_at = ?
        WHERE id = ?`
      )
      .run(
        companyId,
        data.name,
        "crypto",
        data.exchange,
        data.marketCap,
        data.sharesOutstanding,
        ts,
        securityId
      );
  } else {
    const result = sqlite
      .prepare(
        `INSERT INTO securities (
          company_id, symbol, name, asset_type, currency, exchange,
          market_cap, shares_outstanding, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        companyId,
        data.ticker,
        data.name,
        "crypto",
        "USD",
        data.exchange,
        data.marketCap,
        data.sharesOutstanding,
        ts,
        ts
      );
    securityId = result.lastInsertRowid as number;
  }

  return { companyId, securityId, action };
}

export function logSyncResult(
  db: DrizzleDB,
  result: SyncResult
): void {
  const sqlite = getSqlite();
  const ts = nowISO();

  // Upsert data_sources
  const existing = sqlite
    .prepare("SELECT id FROM data_sources WHERE name = ? AND type = ?")
    .get(result.source, result.dataType) as { id: number } | undefined;

  if (existing) {
    sqlite
      .prepare(
        `UPDATE data_sources SET
          last_import_at = ?, records_imported = ?, records_rejected = ?
        WHERE id = ?`
      )
      .run(ts, result.recordsImported, result.recordsRejected, existing.id);
  } else {
    sqlite
      .prepare(
        `INSERT INTO data_sources (name, type, last_import_at, records_imported, records_rejected)
        VALUES (?, ?, ?, ?, ?)`
      )
      .run(result.source, result.dataType, ts, result.recordsImported, result.recordsRejected);
  }

  // Log to import_logs
  sqlite
    .prepare(
      `INSERT INTO import_logs (dataset_type, records_imported, records_rejected, imported_at)
      VALUES (?, ?, ?, ?)`
    )
    .run(result.dataType, result.recordsImported, result.recordsRejected, ts);
}
