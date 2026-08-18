import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const history = await db
      .select()
      .from(schema.marketSentiment)
      .orderBy(desc(schema.marketSentiment.timestamp))
      .limit(30);

    const latest = history[0] ?? {
      score: 65,
      classification: "Greed",
      timestamp: new Date().toISOString(),
      source: "Alternative.me",
      assetClass: "crypto",
    };

    return NextResponse.json({
      latest,
      history,
    });
  } catch (error) {
    console.error("[Sentiment API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch sentiment data" }, { status: 500 });
  }
}
