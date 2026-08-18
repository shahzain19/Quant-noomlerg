import { eq, asc, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { marketDataProvider } from "@/lib/providers/db-provider";
import { nowISO } from "@/lib/utils";

export async function getWatchlists() {
  const db = getDb();
  return db.select().from(schema.watchlists).orderBy(asc(schema.watchlists.name));
}

export async function getWatchlistWithItems(watchlistId: number) {
  const db = getDb();
  const watchlist = await db.query.watchlists.findFirst({
    where: eq(schema.watchlists.id, watchlistId),
  });
  if (!watchlist) return null;

  const items = await db
    .select({
      id: schema.watchlistItems.id,
      sortOrder: schema.watchlistItems.sortOrder,
      securityId: schema.securities.id,
      symbol: schema.securities.symbol,
      name: schema.securities.name,
      assetType: schema.securities.assetType,
    })
    .from(schema.watchlistItems)
    .innerJoin(schema.securities, eq(schema.watchlistItems.securityId, schema.securities.id))
    .where(eq(schema.watchlistItems.watchlistId, watchlistId))
    .orderBy(asc(schema.watchlistItems.sortOrder));

  const withQuotes = [];
  for (const item of items) {
    const quote = await marketDataProvider.getQuote(item.symbol);
    withQuotes.push({ ...item, quote });
  }

  return { ...watchlist, items: withQuotes };
}

export async function createWatchlist(name: string) {
  const db = getDb();
  const [result] = await db
    .insert(schema.watchlists)
    .values({ name, createdAt: nowISO() })
    .returning();
  return result;
}

export async function renameWatchlist(id: number, name: string) {
  const db = getDb();
  await db.update(schema.watchlists).set({ name }).where(eq(schema.watchlists.id, id));
}

export async function deleteWatchlist(id: number) {
  const db = getDb();
  await db.delete(schema.watchlistItems).where(eq(schema.watchlistItems.watchlistId, id));
  await db.delete(schema.watchlists).where(eq(schema.watchlists.id, id));
}

export async function addToWatchlist(watchlistId: number, securityId: number) {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.watchlistItems)
    .where(eq(schema.watchlistItems.watchlistId, watchlistId));

  const maxOrder = existing.reduce((max, i) => Math.max(max, i.sortOrder ?? 0), 0);

  const [result] = await db
    .insert(schema.watchlistItems)
    .values({
      watchlistId,
      securityId,
      sortOrder: maxOrder + 1,
      createdAt: nowISO(),
    })
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function removeFromWatchlist(watchlistId: number, securityId: number) {
  const db = getDb();
  await db
    .delete(schema.watchlistItems)
    .where(
      and(
        eq(schema.watchlistItems.watchlistId, watchlistId),
        eq(schema.watchlistItems.securityId, securityId)
      )
    );
}

export async function getSecurityBySymbol(symbol: string) {
  const db = getDb();
  return db.query.securities.findFirst({
    where: eq(schema.securities.symbol, symbol.toUpperCase()),
  });
}
