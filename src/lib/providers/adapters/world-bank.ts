import type { NormalizedEconomicIndicator, DataProvider } from "./types";

interface WorldBankIndicatorConfig {
  code: string;
  name: string;
  category: string;
  unit: string;
}

const WORLD_BANK_INDICATORS: WorldBankIndicatorConfig[] = [
  { code: "NY.GDP.MKTP.KD.ZG", name: "Real GDP Growth", category: "gdp", unit: "%" },
  { code: "FP.CPI.TOTL.ZG", name: "Consumer Inflation", category: "inflation", unit: "%" },
  { code: "FR.INR.RINN", name: "Real Interest Rate", category: "rates", unit: "%" },
  { code: "NE.RSB.GNFS.ZS", name: "Trade Balance", category: "trade", unit: "% of GDP" },
  { code: "GC.DOD.TOTL.GD.ZS", name: "Government Debt", category: "debt", unit: "% of GDP" },
];

const TARGET_COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "US", name: "United States" },
  { code: "EMU", name: "Euro Area" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWorldBankIndicators(): Promise<NormalizedEconomicIndicator[]> {
  const results: NormalizedEconomicIndicator[] = [];
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;

  for (const country of TARGET_COUNTRIES) {
    for (const ind of WORLD_BANK_INDICATORS) {
      try {
        const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${ind.code}?format=json&date=${startYear}:${currentYear}`;
        const resp = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!resp.ok) {
          await sleep(150);
          continue;
        }

        const data = await resp.json();
        if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
          await sleep(150);
          continue;
        }

        const records = data[1];
        for (const rec of records) {
          if (rec.value == null || isNaN(rec.value)) continue;

          const year = rec.date;
          const timestamp = `${year}-01-01T00:00:00.000Z`;

          results.push({
            name: `${country.code} ${ind.name}`,
            country: country.code,
            timestamp,
            value: parseFloat(rec.value.toFixed(2)),
            unit: ind.unit,
            source: "World Bank",
            category: ind.category,
          });
        }
        await sleep(150);
      } catch (err) {
        console.error(`[WorldBank] Error fetching ${country.code} ${ind.code}:`, err);
      }
    }
  }

  return results;
}

export class WorldBankProvider implements DataProvider {
  name = "worldbank";

  async fetchEconomicIndicators(): Promise<NormalizedEconomicIndicator[]> {
    return fetchWorldBankIndicators();
  }
}
