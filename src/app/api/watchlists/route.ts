import { NextRequest, NextResponse } from "next/server";
import {
  getWatchlists,
  getWatchlistWithItems,
  createWatchlist,
  renameWatchlist,
  deleteWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getSecurityBySymbol,
} from "@/lib/services/watchlists";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const watchlist = await getWatchlistWithItems(parseInt(id));
      if (!watchlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(watchlist);
    }
    const watchlists = await getWatchlists();
    return NextResponse.json(watchlists);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load watchlists" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const watchlist = await createWatchlist(body.name);
      return NextResponse.json(watchlist);
    }
    if (action === "rename") {
      await renameWatchlist(body.id, body.name);
      return NextResponse.json({ success: true });
    }
    if (action === "delete") {
      await deleteWatchlist(body.id);
      return NextResponse.json({ success: true });
    }
    if (action === "add") {
      let securityId = body.securityId;
      if (body.symbol && !securityId) {
        const sec = await getSecurityBySymbol(body.symbol);
        if (!sec) return NextResponse.json({ error: "Security not found" }, { status: 404 });
        securityId = sec.id;
      }
      const item = await addToWatchlist(body.watchlistId, securityId);
      return NextResponse.json(item);
    }
    if (action === "remove") {
      await removeFromWatchlist(body.watchlistId, body.securityId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Watchlist operation failed" }, { status: 500 });
  }
}
