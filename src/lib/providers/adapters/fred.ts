import type {
  NormalizedEconomicIndicator,
  DataProvider,
} from "./types";

const FRED_CSV_BASE = "https://fred.stlouisfed.org/graph/fredgraph.csv";

interface FREDSeries {
  id: string;
  name: string;
  unit: string;
  category: string;
}

const FRED_SERIES: FREDSeries[] = [
  { id: "CPIAUCSL", name: "CPI (Consumer Price Index)", unit: "index", category: "inflation" },
  { id: "UNRATE", name: "Unemployment Rate", unit: "%", category: "employment" },
  { id: "GDP", name: "Gross Domestic Product", unit: "billions USD", category: "gdp" },
  { id: "FEDFUNDS", name: "Federal Funds Rate", unit: "%", category: "rates" },
  { id: "DEXUSEUS", name: "USD Exchange Rate", unit: "index", category: "fx" },
  { id: "DCOILWTICO", name: "WTI Crude Oil", unit: "$/bbl", category: "commodities" },
  { id: "GOLDAMGBD228NLBM", name: "Gold Price", unit: "$/oz", category: "commodities" },
  { id: "DGS10", name: "10-Year Treasury Rate", unit: "%", category: "rates" },
  { id: "DGS2", name: "2-Year Treasury Rate", unit: "%", category: "rates" },
  { id: "UMCSENT", name: "Consumer Sentiment", unit: "index", category: "confidence" },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseFREDcsv(csvText: string): Array<{ date: string; value: number }> {
  const lines = csvText.trim().split("\n");
  const results: Array<{ date: string; value: number }> = [];

  // Skip header line (DATE,series_id)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 2) continue;

    const dateStr = parts[0].trim();
    const valueStr = parts[1].trim();

    // FRED uses "." for missing data
    if (valueStr === "." || valueStr === "" || valueStr === "NaN") continue;

    const value = parseFloat(valueStr);
    if (isNaN(value)) continue;

    // Only include data from the last 12 months
    const dataDate = new Date(dateStr);
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    if (dataDate < twelveMonthsAgo) continue;

    results.push({ date: dataDate.toISOString(), value });
  }

  return results;
}

export class FREDProvider implements DataProvider {
  name = "fred";

  async fetchEconomicIndicators(): Promise<NormalizedEconomicIndicator[]> {
    const results: NormalizedEconomicIndicator[] = [];

    for (const series of FRED_SERIES) {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);

        const startStr = startDate.toISOString().split("T")[0];
        const endStr = endDate.toISOString().split("T")[0];

        const url = `${FRED_CSV_BASE}?id=${series.id}&cosd=${startStr}&coed=${endStr}`;

        const resp = await fetch(url, {
          headers: {
            Accept: "text/csv",
          },
        });

        if (!resp.ok) {
          console.error(
            `[FRED] Error fetching ${series.id}: ${resp.status} ${resp.statusText}`
          );
          await sleep(200);
          continue;
        }

        const csvText = await resp.text();
        const parsed = parseFREDcsv(csvText);

        for (const point of parsed) {
          results.push({
            name: series.name,
            country: "US",
            timestamp: point.date,
            value: point.value,
            unit: series.unit,
            source: "FRED",
            category: series.category,
          });
        }

        await sleep(200);
      } catch (err) {
        console.error(`[FRED] Error fetching series ${series.id}:`, err);
      }
    }

    return results;
  }
}
