export function marketCap(price: number | null, sharesOutstanding: number | null): number | null {
  if (price == null || sharesOutstanding == null || sharesOutstanding <= 0) return null;
  return price * sharesOutstanding;
}

export function peRatio(price: number | null, eps: number | null): number | null {
  if (price == null || eps == null || eps <= 0) return null;
  return price / eps;
}

export function priceToSales(marketCap: number | null, revenue: number | null): number | null {
  if (marketCap == null || revenue == null || revenue <= 0) return null;
  return marketCap / revenue;
}

export function priceToBook(marketCap: number | null, equity: number | null): number | null {
  if (marketCap == null || equity == null || equity <= 0) return null;
  return marketCap / equity;
}

export function grossMargin(grossProfit: number | null, revenue: number | null): number | null {
  if (grossProfit == null || revenue == null || revenue <= 0) return null;
  return (grossProfit / revenue) * 100;
}

export function operatingMargin(operatingIncome: number | null, revenue: number | null): number | null {
  if (operatingIncome == null || revenue == null || revenue <= 0) return null;
  return (operatingIncome / revenue) * 100;
}

export function netMargin(netIncome: number | null, revenue: number | null): number | null {
  if (netIncome == null || revenue == null || revenue <= 0) return null;
  return (netIncome / revenue) * 100;
}

export function freeCashFlow(operatingCashFlow: number | null, capex: number | null): number | null {
  if (operatingCashFlow == null || capex == null) return null;
  return operatingCashFlow - Math.abs(capex);
}

export function enterpriseValue(
  marketCap: number | null,
  debt: number | null,
  cash: number | null
): number | null {
  if (marketCap == null) return null;
  const totalDebt = debt ?? 0;
  const totalCash = cash ?? 0;
  return marketCap + totalDebt - totalCash;
}

export function evToEbitda(enterpriseVal: number | null, ebitda: number | null): number | null {
  if (enterpriseVal == null || ebitda == null || ebitda <= 0) return null;
  return enterpriseVal / ebitda;
}

export function changePercent(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatLargeNumber(value: number | null, currency = "$"): string {
  if (value == null) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${currency}${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${currency}${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${currency}${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${currency}${(value / 1e3).toFixed(2)}K`;
  return `${currency}${value.toFixed(2)}`;
}

export function formatPercent(value: number | null, decimals = 2): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null, decimals = 2): string {
  if (value == null) return "—";
  return value.toFixed(decimals);
}
