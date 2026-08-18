import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();

    const sources = await db
      .select({
        name: schema.dataSources.name,
        type: schema.dataSources.type,
        lastSyncAt: schema.dataSources.lastImportAt,
        recordCount: schema.dataSources.recordsImported,
      })
      .from(schema.dataSources);

    const companiesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.companies);

    const securitiesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.securities);

    const pricesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.prices);

    const financialsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.financialStatements);

    const economicCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.economicIndicators);

    const newsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.news);

    const watchlistsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.watchlists);

    return NextResponse.json({
      sources: sources.map((s) => ({
        name: s.name,
        type: s.type,
        lastSyncAt: s.lastSyncAt,
        recordCount: s.recordCount ?? 0,
      })),
      stats: {
        companies: companiesCount[0]?.count ?? 0,
        securities: securitiesCount[0]?.count ?? 0,
        prices: pricesCount[0]?.count ?? 0,
        financialStatements: financialsCount[0]?.count ?? 0,
        economicIndicators: economicCount[0]?.count ?? 0,
        news: newsCount[0]?.count ?? 0,
        watchlists: watchlistsCount[0]?.count ?? 0,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
