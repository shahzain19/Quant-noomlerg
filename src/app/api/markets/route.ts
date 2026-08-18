import { NextRequest, NextResponse } from "next/server";
import { getMarketsOverview, getSecuritiesByType } from "@/lib/providers/db-provider";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    if (type) {
      const securities = await getSecuritiesByType(type);
      return NextResponse.json(securities);
    }
    const markets = await getMarketsOverview();
    return NextResponse.json(markets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load markets" }, { status: 500 });
  }
}
