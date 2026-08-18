import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const companies = await db.select().from(schema.companies).orderBy(schema.companies.ticker);
    return NextResponse.json(companies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 });
  }
}
