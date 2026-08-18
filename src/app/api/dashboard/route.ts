import { NextResponse } from "next/server";
import { getMarketsOverview, getTopMovers } from "@/lib/providers/db-provider";
import { getRecentNews } from "@/lib/services/search";
import { getWatchlistWithItems, getWatchlists } from "@/lib/services/watchlists";
import { getSettings } from "@/lib/services/settings";

export async function GET() {
  try {
    const [markets, movers, news, watchlists, settings] = await Promise.all([
      getMarketsOverview(),
      getTopMovers(5),
      getRecentNews(6),
      getWatchlists(),
      getSettings(),
    ]);

    let watchlist = null;
    if (settings.defaultWatchlistId) {
      watchlist = await getWatchlistWithItems(settings.defaultWatchlistId);
    } else if (watchlists.length > 0) {
      watchlist = await getWatchlistWithItems(watchlists[0].id);
    }

    return NextResponse.json({ markets, movers, news, watchlist });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
