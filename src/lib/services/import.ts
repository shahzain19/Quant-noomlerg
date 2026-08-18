import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nowISO } from "@/lib/utils";
import type { ImportResult } from "@/types";
import { z } from "zod";

const companyRowSchema = z.object({
  name: z.string().min(1),
  ticker: z.string().min(1),
  exchange: z.string().min(1),
  sector: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});

const priceRowSchema = z.object({
  symbol: z.string().min(1),
  timestamp: z.string().min(1),
  open: z.coerce.number(),
  high: z.coerce.number(),
  low: z.coerce.number(),
  close: z.coerce.number(),
  volume: z.coerce.number().optional(),
});

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

export async function importDataset(
  content: string,
  datasetType: string,
  filename?: string
): Promise<ImportResult> {
  const db = getDb();
  let imported = 0;
  let rejected = 0;
  const errors: string[] = [];

  if (datasetType === "companies") {
    const rows = parseCSV(content);
    for (const row of rows) {
      try {
        const parsed = companyRowSchema.parse(row);
        const ts = nowISO();
        await db
          .insert(schema.companies)
          .values({
            name: parsed.name,
            ticker: parsed.ticker.toUpperCase(),
            exchange: parsed.exchange,
            sector: parsed.sector ?? null,
            industry: parsed.industry ?? null,
            country: parsed.country ?? "US",
            description: parsed.description ?? null,
            createdAt: ts,
            updatedAt: ts,
          })
          .onConflictDoNothing();
        imported++;
      } catch (e) {
        rejected++;
        errors.push(`Row rejected: ${JSON.stringify(row)}`);
      }
    }
  } else if (datasetType === "prices") {
    const rows = parseCSV(content);
    for (const row of rows) {
      try {
        const parsed = priceRowSchema.parse(row);
        const security = await db.query.securities.findFirst({
          where: eq(schema.securities.symbol, parsed.symbol.toUpperCase()),
        });
        if (!security) {
          rejected++;
          errors.push(`Unknown symbol: ${parsed.symbol}`);
          continue;
        }
        await db
          .insert(schema.prices)
          .values({
            securityId: security.id,
            timestamp: parsed.timestamp,
            open: parsed.open,
            high: parsed.high,
            low: parsed.low,
            close: parsed.close,
            volume: parsed.volume ?? null,
          })
          .onConflictDoNothing();
        imported++;
      } catch {
        rejected++;
        errors.push(`Row rejected: ${JSON.stringify(row)}`);
      }
    }
  } else if (datasetType === "economic") {
    const rows = parseCSV(content);
    for (const row of rows) {
      try {
        if (!row.name || !row.timestamp || !row.value) {
          rejected++;
          continue;
        }
        await db.insert(schema.economicIndicators).values({
          name: row.name,
          country: row.country ?? "US",
          timestamp: row.timestamp,
          value: parseFloat(row.value),
          unit: row.unit ?? null,
          source: row.source ?? "import",
          category: row.category ?? null,
        });
        imported++;
      } catch {
        rejected++;
      }
    }
  } else if (datasetType === "news") {
    const rows = parseCSV(content);
    for (const row of rows) {
      try {
        if (!row.title) {
          rejected++;
          continue;
        }
        await db.insert(schema.news).values({
          title: row.title,
          summary: row.summary ?? null,
          source: row.source ?? "import",
          url: row.url ?? null,
          publishedAt: row.published_at ?? row.publishedAt ?? nowISO(),
          relatedSymbol: row.symbol ?? null,
        });
        imported++;
      } catch {
        rejected++;
      }
    }
  } else {
    throw new Error(`Unsupported dataset type: ${datasetType}`);
  }

  await db.insert(schema.importLogs).values({
    datasetType,
    recordsImported: imported,
    recordsRejected: rejected,
    importedAt: nowISO(),
    filename: filename ?? null,
  });

  return { recordsImported: imported, recordsRejected: rejected, errors: errors.slice(0, 10) };
}

export async function importJSON(content: string, datasetType: string, filename?: string): Promise<ImportResult> {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) throw new Error("JSON must be an array");
  const headers = Object.keys(data[0] ?? {});
  const csvLines = [headers.join(",")];
  for (const row of data) {
    csvLines.push(headers.map((h) => String(row[h] ?? "")).join(","));
  }
  return importDataset(csvLines.join("\n"), datasetType, filename);
}
