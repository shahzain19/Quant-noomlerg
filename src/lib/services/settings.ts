import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { AppSettings } from "@/types";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  density: "compact",
  uiMode: "explorer",
  defaultWatchlistId: null,
  defaultChartRange: "1M",
};

export async function getSettings(): Promise<AppSettings> {
  const db = getDb();
  const rows = await db.select().from(schema.settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    theme: (map.theme as AppSettings["theme"]) ?? DEFAULT_SETTINGS.theme,
    density: (map.density as AppSettings["density"]) ?? DEFAULT_SETTINGS.density,
    uiMode: (map.uiMode as AppSettings["uiMode"]) ?? DEFAULT_SETTINGS.uiMode,
    defaultWatchlistId: map.defaultWatchlistId ? parseInt(map.defaultWatchlistId) : null,
    defaultChartRange: (map.defaultChartRange as AppSettings["defaultChartRange"]) ?? DEFAULT_SETTINGS.defaultChartRange,
  };
}

export async function updateSettings(updates: Partial<AppSettings>) {
  const db = getDb();
  const entries = Object.entries(updates);
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    const strVal = value === null ? "" : String(value);
    await db
      .insert(schema.settings)
      .values({ key, value: strVal })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value: strVal } });
  }
  return getSettings();
}

export async function getEconomicIndicators(category?: string) {
  const db = getDb();
  const indicators = await db
    .selectDistinct({ name: schema.economicIndicators.name, category: schema.economicIndicators.category })
    .from(schema.economicIndicators);

  const results = [];
  for (const ind of indicators) {
    if (category && ind.category !== category) continue;
    const latest = await db
      .select()
      .from(schema.economicIndicators)
      .where(eq(schema.economicIndicators.name, ind.name))
      .orderBy(desc(schema.economicIndicators.timestamp))
      .limit(12);

    if (latest.length > 0) {
      results.push({
        name: ind.name,
        category: ind.category,
        unit: latest[0].unit,
        source: latest[0].source,
        latest: latest[0],
        history: latest.reverse(),
      });
    }
  }
  return results;
}

export async function getImportStats() {
  const db = getDb();
  const logs = await db
    .select()
    .from(schema.importLogs)
    .orderBy(desc(schema.importLogs.importedAt))
    .limit(1);

  const totalImported = await db
    .select({ count: schema.importLogs.recordsImported })
    .from(schema.importLogs);

  const sumImported = totalImported.reduce((s, r) => s + (r.count ?? 0), 0);
  const lastLog = logs[0];

  return {
    recordsImported: sumImported,
    recordsRejected: lastLog?.recordsRejected ?? 0,
    lastUpdated: lastLog?.importedAt ?? null,
    lastLog,
  };
}
