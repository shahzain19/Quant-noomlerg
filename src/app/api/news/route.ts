import { NextRequest, NextResponse } from "next/server";
import { getAllNews } from "@/lib/services/search";

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0");
    const news = await getAllNews(limit, offset);
    return NextResponse.json(news);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load news" }, { status: 500 });
  }
}
