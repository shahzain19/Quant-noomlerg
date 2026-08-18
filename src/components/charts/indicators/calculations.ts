import type { PricePoint } from "@/types";
import type { OverlayConfig } from "../types";

export function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += data[j];
      result.push(sum / period);
    }
  }
  return result;
}

export function ema(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[j];
      prev = sum / period;
      result.push(prev);
    } else {
      prev = data[i] * k + prev! * (1 - k);
      result.push(prev);
    }
  }
  return result;
}

export function bollingerBands(
  data: number[],
  period: number = 20,
  multiplier: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = sma(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (middle[i] == null) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sumSq += (data[j] - middle[i]!) ** 2;
      }
      const std = Math.sqrt(sumSq / period);
      upper.push(middle[i]! + multiplier * std);
      lower.push(middle[i]! - multiplier * std);
    }
  }

  return { upper, middle, lower };
}

export function vwap(data: PricePoint[]): (number | null)[] {
  const result: (number | null)[] = [];
  let cumTP = 0;
  let cumVol = 0;

  for (const d of data) {
    const tp = (d.high + d.low + d.close) / 3;
    const vol = d.volume ?? 0;
    cumTP += tp * vol;
    cumVol += vol;
    result.push(cumVol > 0 ? cumTP / cumVol : null);
  }

  return result;
}

export function rsi(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (data.length < period + 1) return data.map(() => null);

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = 0; i < period; i++) result.push(null);

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  return result;
}

export function macd(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const fastEMA = ema(data, fastPeriod);
  const slowEMA = ema(data, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] == null || slowEMA[i] == null) macdLine.push(null);
    else macdLine.push(fastEMA[i]! - slowEMA[i]!);
  }

  const validMacd = macdLine.filter((v): v is number => v != null);
  const signalEMA = ema(validMacd, signalPeriod);

  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  let signalIdx = 0;

  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] == null) {
      signalLine.push(null);
      histogram.push(null);
    } else {
      if (signalIdx < signalEMA.length) {
        signalLine.push(signalEMA[signalIdx]);
        if (signalEMA[signalIdx] != null) {
          histogram.push(macdLine[i]! - signalEMA[signalIdx]!);
        } else {
          histogram.push(null);
        }
      } else {
        signalLine.push(null);
        histogram.push(null);
      }
      signalIdx++;
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

export function computeOverlay(
  data: PricePoint[],
  config: OverlayConfig
): (number | null)[] {
  const closes = data.map((d) => d.close);
  switch (config.type) {
    case "sma":
      return sma(closes, config.period ?? 20);
    case "ema":
      return ema(closes, config.period ?? 20);
    case "bollinger":
      return bollingerBands(closes, config.period ?? 20).middle;
    case "vwap":
      return vwap(data);
    default:
      return data.map(() => null);
  }
}

export function computeBollingerBands(
  data: PricePoint[],
  period: number = 20,
  multiplier: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  return bollingerBands(data.map((d) => d.close), period, multiplier);
}

export function toPercentage(data: PricePoint[], baseIndex: number = 0): number[] {
  const base = data[baseIndex]?.close ?? 1;
  return data.map((d) => ((d.close - base) / base) * 100);
}

export function toIndexed(data: PricePoint[], baseIndex: number = 0): number[] {
  const base = data[baseIndex]?.close ?? 1;
  return data.map((d) => (d.close / base) * 100);
}

export function computeComparisonData(
  series: PricePoint[][],
  baseIndex: number = 0
): number[][] {
  return series.map((data) => toIndexed(data, baseIndex));
}
