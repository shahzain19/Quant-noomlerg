import { NextRequest, NextResponse } from "next/server";
import { getEconomicIndicators } from "@/lib/services/settings";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const db = getDb();

    if (type === "yield_curve") {
      const data = await db.select().from(schema.yieldCurve).orderBy(desc(schema.yieldCurve.date));
      return NextResponse.json(data);
    }

    if (type === "macro_calendar") {
      const data = await db.select().from(schema.macroEvents).orderBy(schema.macroEvents.date);
      return NextResponse.json(data);
    }

    if (type === "filings") {
      const data = await db.select().from(schema.filings).orderBy(desc(schema.filings.filedAt)).limit(100);
      return NextResponse.json(data);
    }

    if (type === "insider_transactions") {
      const data = await db.select().from(schema.insiderTransactions).orderBy(desc(schema.insiderTransactions.filedAt)).limit(100);
      return NextResponse.json(data);
    }

    // Default: economic indicators
    const indicators = await getEconomicIndicators();
    return NextResponse.json(indicators);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load economy data" }, { status: 500 });
  }
}
