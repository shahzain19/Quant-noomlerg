import type { NormalizedMarketSentiment, DataProvider } from "./types";

interface AlternativeMeResponse {
  name?: string;
  data?: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update?: string;
  }>;
}

export async function fetchMarketSentiment(limitDays = 365): Promise<NormalizedMarketSentiment[]> {
  try {
    const url = `https://api.alternative.me/fng/?limit=${limitDays}&format=json`;
    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      console.error(`[SentimentIndex] Error fetching sentiment: ${resp.status}`);
      return [];
    }

    const json: AlternativeMeResponse = await resp.json();
    if (!json.data || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item) => {
      const tsNum = parseInt(item.timestamp, 10);
      const isoTimestamp = !isNaN(tsNum)
        ? new Date(tsNum * 1000).toISOString()
        : new Date().toISOString();

      return {
        timestamp: isoTimestamp,
        score: parseInt(item.value, 10) || 50,
        classification: item.value_classification || "Neutral",
        assetClass: "crypto",
        source: "Alternative.me",
      };
    });
  } catch (err) {
    console.error("[SentimentIndex] Error during sentiment fetch:", err);
    return [];
  }
}

export class SentimentIndexProvider implements DataProvider {
  name = "sentiment_index";

  async fetchMarketSentiment(limitDays = 365): Promise<NormalizedMarketSentiment[]> {
    return fetchMarketSentiment(limitDays);
  }
}
