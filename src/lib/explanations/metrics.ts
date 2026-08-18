export interface MetricExplanation {
  key: string;
  label: string;
  plainEnglish: string;
  caveman: string;
  learnMore?: string;
}

export const METRIC_EXPLANATIONS: Record<string, MetricExplanation> = {
  marketCap: {
    key: "marketCap",
    label: "Market Capitalization",
    plainEnglish:
      "This is roughly what the entire company is worth according to its current stock price.",
    caveman:
      "If you wanted to buy every share of the company, the theoretical price would be about this much.",
  },
  peRatio: {
    key: "peRatio",
    label: "P/E Ratio",
    plainEnglish:
      "Shows how much investors pay for each dollar of annual earnings. Higher usually means higher growth expectations.",
    caveman: "How many dollars you pay for one dollar of profit.",
  },
  eps: {
    key: "eps",
    label: "Earnings Per Share (EPS)",
    plainEnglish: "The company's profit divided by the number of shares. More EPS generally means more profit per share.",
    caveman: "How much money the company made for each share you own.",
  },
  revenue: {
    key: "revenue",
    label: "Revenue",
    plainEnglish: "Total money the company brought in from selling products or services before expenses.",
    caveman: "All the money coming in the door from sales.",
  },
  grossMargin: {
    key: "grossMargin",
    label: "Gross Margin",
    plainEnglish: "What percentage of revenue remains after direct production costs. Higher means better pricing power or efficiency.",
    caveman: "After making the product, how much money is left as a percentage of sales.",
  },
  operatingMargin: {
    key: "operatingMargin",
    label: "Operating Margin",
    plainEnglish: "Profit from core operations as a percentage of revenue, before interest and taxes.",
    caveman: "How much of every sales dollar the business keeps after running day-to-day operations.",
  },
  netMargin: {
    key: "netMargin",
    label: "Net Margin",
    plainEnglish: "Final profit as a percentage of revenue after all expenses, taxes, and interest.",
    caveman: "The actual bottom-line profit percentage on every dollar of sales.",
  },
  debt: {
    key: "debt",
    label: "Total Debt",
    plainEnglish: "Money the company owes to lenders. Some debt can fund growth, but too much increases risk.",
    caveman: "How much the company borrowed and still needs to pay back.",
  },
  freeCashFlow: {
    key: "freeCashFlow",
    label: "Free Cash Flow",
    plainEnglish: "Cash left after running the business and investing in equipment. Available for dividends, buybacks, or debt repayment.",
    caveman: "Real cash the company has left over after paying bills and buying stuff it needs.",
  },
  beta: {
    key: "beta",
    label: "Beta",
    plainEnglish: "Measures how much the stock tends to move compared to the overall market. Beta above 1 means more volatile.",
    caveman: "If the market sneezes, does this stock catch a cold or a fever?",
  },
  dividendYield: {
    key: "dividendYield",
    label: "Dividend Yield",
    plainEnglish: "Annual dividend payments as a percentage of the stock price. Shows income return to shareholders.",
    caveman: "How much cash the company pays you each year just for holding the stock.",
  },
  enterpriseValue: {
    key: "enterpriseValue",
    label: "Enterprise Value",
    plainEnglish: "Theoretical total cost to buy the entire company, including debt and minus cash.",
    caveman: "What it would really cost to own the whole business, debts included.",
  },
  priceToSales: {
    key: "priceToSales",
    label: "P/S Ratio",
    plainEnglish: "Compares the company's market value to its revenue. Useful when earnings are negative or volatile.",
    caveman: "How much you pay for each dollar of sales.",
  },
  priceToBook: {
    key: "priceToBook",
    label: "P/B Ratio",
    plainEnglish: "Compares market value to book value of equity. Below 1 may suggest undervaluation relative to assets.",
    caveman: "How much you pay compared to what the company's stuff is worth on paper.",
  },
  evToEbitda: {
    key: "evToEbitda",
    label: "EV/EBITDA",
    plainEnglish: "Compares total company value to operating earnings before interest, taxes, depreciation, and amortization.",
    caveman: "A way to compare company sizes ignoring how they finance themselves.",
  },
};

export function getMetricExplanation(key: string): MetricExplanation | null {
  return METRIC_EXPLANATIONS[key] ?? null;
}
