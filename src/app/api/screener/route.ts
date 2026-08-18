import { NextRequest, NextResponse } from "next/server";
import { runScreener, getScreenerFacets } from "@/lib/services/screener";
import type { ScreenerFilter } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const filters: ScreenerFilter = {
      minPrice: p.get("minPrice") ? parseFloat(p.get("minPrice")!) : undefined,
      maxPrice: p.get("maxPrice") ? parseFloat(p.get("maxPrice")!) : undefined,
      minMarketCap: p.get("minMarketCap") ? parseFloat(p.get("minMarketCap")!) : undefined,
      maxMarketCap: p.get("maxMarketCap") ? parseFloat(p.get("maxMarketCap")!) : undefined,
      minPe: p.get("minPe") ? parseFloat(p.get("minPe")!) : undefined,
      maxPe: p.get("maxPe") ? parseFloat(p.get("maxPe")!) : undefined,
      minRevenueGrowth: p.get("minRevenueGrowth") ? parseFloat(p.get("minRevenueGrowth")!) : undefined,
      minProfitMargin: p.get("minProfitMargin") ? parseFloat(p.get("minProfitMargin")!) : undefined,
      maxDebt: p.get("maxDebt") ? parseFloat(p.get("maxDebt")!) : undefined,
      minDividendYield: p.get("minDividendYield") ? parseFloat(p.get("minDividendYield")!) : undefined,
      sector: p.get("sector") ?? undefined,
      country: p.get("country") ?? undefined,
      exchange: p.get("exchange") ?? undefined,
    };

    const sortBy = p.get("sortBy") ?? "marketCap";
    const sortDir = (p.get("sortDir") ?? "desc") as "asc" | "desc";
    const limit = parseInt(p.get("limit") ?? "50");
    const offset = parseInt(p.get("offset") ?? "0");

    const { results, total } = await runScreener(filters, sortBy, sortDir, limit, offset);
    const facets = await getScreenerFacets();

    return NextResponse.json({ results, total, facets });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Screener failed" }, { status: 500 });
  }
}
