const FRED_CSV_BASE = "https://fred.stlouisfed.org/graph/fredgraph.csv";

interface TreasuryMaturity {
  id: string;
  label: string;
  sortOrder: number;
}

const MATURITIES: TreasuryMaturity[] = [
  { id: "DGS1MO", label: "1-Month", sortOrder: 0 },
  { id: "DGS3MO", label: "3-Month", sortOrder: 1 },
  { id: "DGS6MO", label: "6-Month", sortOrder: 2 },
  { id: "DGS1", label: "1-Year", sortOrder: 3 },
  { id: "DGS2", label: "2-Year", sortOrder: 4 },
  { id: "DGS3", label: "3-Year", sortOrder: 5 },
  { id: "DGS5", label: "5-Year", sortOrder: 6 },
  { id: "DGS7", label: "7-Year", sortOrder: 7 },
  { id: "DGS10", label: "10-Year", sortOrder: 8 },
  { id: "DGS20", label: "20-Year", sortOrder: 9 },
  { id: "DGS30", label: "30-Year", sortOrder: 10 },
];

export interface YieldCurvePoint {
  date: string;
  maturity: string;
  yieldValue: number;
  spreadVs10Y: number | null;
}

interface ParsedRow {
  date: string;
  values: Map<string, number>;
}

function parseMultiSeriesCSV(
  csvText: string,
  seriesIds: string[]
): ParsedRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const dateIdx = header.indexOf("DATE");
  if (dateIdx === -1) return [];

  const seriesIndices = seriesIds.map((id) => ({
    id,
    idx: header.indexOf(id),
  }));

  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    const dateStr = parts[dateIdx]?.trim();
    if (!dateStr) continue;

    const values = new Map<string, number>();
    let hasValid = false;

    for (const { id, idx } of seriesIndices) {
      if (idx === -1) continue;
      const raw = parts[idx]?.trim();
      if (!raw || raw === "." || raw === "NaN" || raw === "") continue;
      const val = parseFloat(raw);
      if (isNaN(val)) continue;
      values.set(id, val);
      hasValid = true;
    }

    if (hasValid) {
      rows.push({ date: dateStr, values });
    }
  }

  return rows;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchYieldCurve(): Promise<YieldCurvePoint[]> {
  const seriesIds = MATURITIES.map((m) => m.id);

  try {
    const startDate = "2024-01-01";
    const url = `${FRED_CSV_BASE}?id=${seriesIds.join(",")}&cosd=${startDate}`;

    const resp = await fetch(url, {
      headers: { Accept: "text/csv" },
    });

    if (!resp.ok) {
      console.error(
        `[YieldCurve] Error fetching data: ${resp.status} ${resp.statusText}`
      );
      return [];
    }

    const csvText = await resp.text();
    const rows = parseMultiSeriesCSV(csvText, seriesIds);

    if (rows.length === 0) {
      console.error("[YieldCurve] No valid data parsed from CSV");
      return [];
    }

    const latestRow = rows[rows.length - 1];
    const tenYearYield = latestRow.values.get("DGS10") ?? null;

    const points: YieldCurvePoint[] = [];

    for (const maturity of MATURITIES) {
      const yieldVal = latestRow.values.get(maturity.id);
      if (yieldVal === undefined) continue;

      points.push({
        date: latestRow.date,
        maturity: maturity.label,
        yieldValue: yieldVal,
        spreadVs10Y:
          tenYearYield !== null
            ? Math.round((yieldVal - tenYearYield) * 100) / 100
            : null,
      });
    }

    return points.sort((a, b) => {
      const aOrder = MATURITIES.find((m) => m.label === a.maturity)?.sortOrder ?? 0;
      const bOrder = MATURITIES.find((m) => m.label === b.maturity)?.sortOrder ?? 0;
      return aOrder - bOrder;
    });
  } catch (err) {
    console.error("[YieldCurve] Error fetching yield curve:", err);
    return [];
  }
}
