import type {
  NormalizedCompany,
  NormalizedPrice,
  DataProvider,
} from "./types";

const BASE_URL = "https://api.coingecko.com/api/v3";

const COIN_ID_TO_SYMBOL: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  tether: "USDT",
  binancecoin: "BNB",
  solana: "SOL",
  ripple: "XRP",
  "usd-coin": "USDC",
  dogecoin: "DOGE",
  cardano: "ADA",
  "shiba-inu": "SHIB",
  avalanche: "AVAX",
  polkadot: "DOT",
  "chainlink": "LINK",
  "matic-network": "MATIC",
  "litecoin": "LTC",
  "uniswap": "UNI",
  "stellar": "XLM",
  "cosmos": "ATOM",
  "monero": "XMR",
  "tron": "TRX",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  price_change_percentage_30d_in_currency: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  description?: { en?: string };
  links?: { homepage?: string[] };
}

interface CoinGeckoMarketChart {
  prices: Array<[number, number]>;
  market_caps: Array<[number, number]>;
  total_volumes: Array<[number, number]>;
}

export class CoinGeckoProvider implements DataProvider {
  name = "coingecko";

  async fetchCrypto(): Promise<NormalizedCompany[]> {
    try {
      const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`;
      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) {
        throw new Error(`CoinGecko API error: ${resp.status} ${resp.statusText}`);
      }

      const data: CoinGeckoMarket[] = await resp.json();

      return data.map((coin) => ({
        ticker: COIN_ID_TO_SYMBOL[coin.id] ?? coin.symbol.toUpperCase(),
        name: coin.name,
        exchange: "CRYPTO",
        sector: "Cryptocurrency",
        industry: "Digital Asset",
        country: null,
        description: null,
        website: null,
        marketCap: coin.market_cap ?? null,
        peRatio: null,
        eps: null,
        revenue: null,
        netMargin: null,
        revenueGrowth: null,
        dividendYield: null,
        debt: null,
        beta: null,
        priceToSales: null,
        priceToBook: null,
        evToEbitda: null,
        high52w: coin.ath ?? null,
        low52w: null,
        sharesOutstanding: coin.circulating_supply ?? null,
        currentPrice: coin.current_price ?? null,
      }));
    } catch (err) {
      console.error("[CoinGecko] Error fetching crypto markets:", err);
      return [];
    }
  }

  async fetchCryptoPrices(symbol: string, days: number): Promise<NormalizedPrice[]> {
    // Find CoinGecko ID from symbol
    const coinId = Object.entries(COIN_ID_TO_SYMBOL).find(
      ([, sym]) => sym === symbol.toUpperCase()
    )?.[0];

    if (!coinId) {
      console.error(`[CoinGecko] Unknown symbol: ${symbol}`);
      return [];
    }

    try {
      const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) {
        throw new Error(`CoinGecko API error: ${resp.status} ${resp.statusText}`);
      }

      const data: CoinGeckoMarketChart = await resp.json();

      // CoinGecko returns [timestamp_ms, price] pairs
      // For daily data, we get one point per day
      return data.prices.map((point) => {
        const date = new Date(point[0]);
        const volumeEntry = data.total_volumes.find(
          (v) => Math.abs(v[0] - point[0]) < 3600000 // within 1 hour
        );

        return {
          symbol,
          timestamp: date.toISOString(),
          open: point[1],
          high: point[1],
          low: point[1],
          close: point[1],
          volume: volumeEntry ? volumeEntry[1] : null,
        };
      });
    } catch (err) {
      console.error(`[CoinGecko] Error fetching prices for ${symbol}:`, err);
      return [];
    }
  }
}
