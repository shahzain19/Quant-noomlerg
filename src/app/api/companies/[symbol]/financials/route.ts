import { NextRequest, NextResponse } from "next/server";
import { marketDataProvider } from "@/lib/providers/db-provider";
import type { PeriodType } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const periodType = (req.nextUrl.searchParams.get("periodType") ?? "annual") as PeriodType;
    const financials = await marketDataProvider.getFinancials(symbol, periodType);
    return NextResponse.json(financials);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load financials" }, { status: 500 });
  }
}
