import { NextRequest, NextResponse } from "next/server";
import { marketDataProvider } from "@/lib/providers/db-provider";
import { getNewsForCompany, getEventsForCompany } from "@/lib/services/search";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const company = await marketDataProvider.getCompany(symbol);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const [news, events] = await Promise.all([
      getNewsForCompany(company.id, 10),
      getEventsForCompany(company.id, 10),
    ]);

    return NextResponse.json({ ...company, news, events });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load company" }, { status: 500 });
  }
}
