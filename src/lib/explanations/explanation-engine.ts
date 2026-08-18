export interface ExplanationContext {
  priceChangePercent?: number | null;
  volumeChangePercent?: number | null;
  metric?: string;
  value?: number | null;
  symbol?: string;
  type?: "chart" | "table" | "metric" | "screener" | "market";
}

export interface ExplanationResult {
  title: string;
  body: string;
  suggestions?: string[];
}

export interface ExplanationEngine {
  explain(context: ExplanationContext): ExplanationResult;
}

class LocalExplanationEngine implements ExplanationEngine {
  explain(context: ExplanationContext): ExplanationResult {
    if (context.type === "chart" || (context.priceChangePercent != null && context.volumeChangePercent != null)) {
      return this.explainPriceMove(context);
    }
    if (context.type === "screener") {
      return {
        title: "About this screener",
        body: "This screener filters securities stored in your local database using the criteria you set. Results update based on the latest available data.",
        suggestions: ["Try adjusting filters to narrow results", "Click column headers to sort"],
      };
    }
    if (context.type === "market") {
      return {
        title: "Market overview",
        body: "These figures summarize major market indices and assets from your local database. Percentages show change from the previous close.",
        suggestions: ["Open a symbol for detailed charts", "Check News for related events"],
      };
    }
    return {
      title: "Explanation",
      body: "This view shows data from your local ATLAS database, sourced from Yahoo Finance, CoinGecko, and FRED.",
    };
  }

  private explainPriceMove(context: ExplanationContext): ExplanationResult {
    const priceChange = context.priceChangePercent ?? 0;
    const volumeChange = context.volumeChangePercent ?? 0;
    const symbol = context.symbol ?? "This security";

    let body = "";
    const suggestions = ["Check the News and Events sections for possible causes"];

    const priceUp = priceChange > 1;
    const priceDown = priceChange < -1;
    const volumeHigh = volumeChange > 30;
    const volumeLow = volumeChange < -30;

    if (priceUp && volumeHigh) {
      body = `${symbol} rose significantly while trading volume was also much higher than normal. That means the move involved substantially more trading activity than usual. This does not tell us by itself WHY the stock rose.`;
    } else if (priceDown && volumeHigh) {
      body = `${symbol} fell noticeably with above-average volume. Higher volume on a decline often means more investors were actively selling. Check news for potential catalysts.`;
    } else if (priceUp && !volumeHigh) {
      body = `${symbol} moved up on relatively normal volume. The gain may reflect steady buying rather than a dramatic event.`;
    } else if (priceDown && !volumeHigh) {
      body = `${symbol} declined slightly with typical trading activity. Small moves on normal volume are common and may not indicate a major shift.`;
    } else if (Math.abs(priceChange) <= 1) {
      body = `${symbol} was relatively flat today. Price stayed within a narrow range compared to recent sessions.`;
    } else {
      body = `${symbol} showed a ${priceChange >= 0 ? "positive" : "negative"} price move of about ${Math.abs(priceChange).toFixed(1)}%.`;
    }

    if (volumeHigh) {
      body += " Volume was elevated compared to recent averages.";
    } else if (volumeLow) {
      body += " Trading was quieter than usual.";
    }

    return { title: "Price movement analysis", body, suggestions };
  }
}

export const explanationEngine: ExplanationEngine = new LocalExplanationEngine();
