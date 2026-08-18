import { NextRequest, NextResponse } from "next/server";
import { marketDataProvider } from "@/lib/providers/db-provider";
import type { ChartRange } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const range = (req.nextUrl.searchParams.get("range") ?? "1M") as ChartRange;
    const prices = await marketDataProvider.getHistoricalPrices(symbol, range);
    return NextResponse.json(prices);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load prices" }, { status: 500 });
  }
}
