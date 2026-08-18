import { NextRequest, NextResponse } from "next/server";
import {
  syncCompanies,
  syncPrices,
  syncFinancials,
  syncEconomicIndicators,
  syncCrypto,
  syncAll,
  syncNews,
  syncRssNews,
  syncFilings,
  syncInsiderTransactions,
  syncYieldCurve,
  syncMacroCalendar,
  syncExpandedTickers,
  syncEtfTickers,
  syncWorldBankData,
  syncMarketSentiment,
} from "@/lib/ingestion/orchestrator";

import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const sources = await db.select().from(schema.dataSources);
    const companiesCount = await db.select({ count: sql<number>`count(*)` }).from(schema.companies);
    const pricesCount = await db.select({ count: sql<number>`count(*)` }).from(schema.prices);
    const financialsCount = await db.select({ count: sql<number>`count(*)` }).from(schema.financialStatements);
    const economicCount = await db.select({ count: sql<number>`count(*)` }).from(schema.economicIndicators);

    return NextResponse.json({
      sources: sources.map((s) => ({
        name: s.name,
        type: s.type,
        lastSyncAt: s.lastImportAt,
        recordCount: s.recordsImported ?? 0,
      })),
      stats: {
        companies: companiesCount[0]?.count ?? 0,
        prices: pricesCount[0]?.count ?? 0,
        financials: financialsCount[0]?.count ?? 0,
        economicIndicators: economicCount[0]?.count ?? 0,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch sync status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tickers, symbols } = body;

    let result;

    switch (action) {
      case "syncCompanies":
        result = await syncCompanies(tickers);
        break;
      case "syncPrices":
        result = await syncPrices(symbols);
        break;
      case "syncFinancials":
        result = await syncFinancials(tickers);
        break;
      case "syncEconomic":
        result = await syncEconomicIndicators();
        break;
      case "syncCrypto":
        result = await syncCrypto();
        break;
      case "syncNews":
        result = await syncNews();
        break;
      case "syncRssNews":
        result = await syncRssNews();
        break;
      case "syncFilings":
        result = await syncFilings();
        break;
      case "syncInsider":
        result = await syncInsiderTransactions();
        break;
      case "syncYieldCurve":
        result = await syncYieldCurve();
        break;
      case "syncMacroCalendar":
        result = await syncMacroCalendar();
        break;
      case "syncExpanded":
        result = await syncExpandedTickers();
        break;
      case "syncEtfs":
        result = await syncEtfTickers();
        break;
      case "syncWorldBank":
        result = await syncWorldBankData();
        break;
      case "syncSentiment":
        result = await syncMarketSentiment();
        break;
      case "syncAll":
        result = await syncAll();
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

