const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export function getGroqApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("atlas-groq-api-key");
}

export function setGroqApiKey(key: string) {
  localStorage.setItem("atlas-groq-api-key", key);
}

export function clearGroqApiKey() {
  localStorage.removeItem("atlas-groq-api-key");
}

export const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", speed: "~300 t/s", free: true, cost: "Groq Cloud" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", speed: "~800 t/s", free: true, cost: "Groq Cloud" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", speed: "~500 t/s", free: true, cost: "Groq Cloud" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B", speed: "~450 t/s", free: true, cost: "Groq Cloud" },
] as const;

export type GroqModelId = typeof GROQ_MODELS[number]["id"];

const DEFAULT_MODEL: GroqModelId = "llama-3.3-70b-versatile";

export function getGroqModel(): GroqModelId {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return (localStorage.getItem("atlas-groq-model") as GroqModelId) || DEFAULT_MODEL;
}

export function setGroqModel(modelId: GroqModelId) {
  localStorage.setItem("atlas-groq-model", modelId);
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MarketContext {
  symbol?: string;
  price?: number | null;
  change?: number | null;
  changePercent?: number | null;
  volume?: number | null;
  pe?: number | null;
  marketCap?: number | null;
  high52w?: number | null;
  low52w?: number | null;
  sector?: string | null;
  industry?: string | null;
  recentPrices?: { date: string; close: number }[];
  news?: { title: string; source: string | null; date: string }[];
  financials?: { period: string; revenue: number | null; netIncome: number | null; eps: number | null }[];
  economicIndicators?: { name: string; value: number; unit: string | null }[];
  marketOverview?: { symbol: string; price: number | null; changePercent: number | null }[];
}

function buildSystemPrompt(ctx?: MarketContext): string {
  let prompt = `You are ATLAS, a financial analyst AI assistant embedded in a Bloomberg-style terminal. You have access to real market data from the user's local database. Be concise, direct, and actionable. Use bullet points. No fluff. Format numbers with commas. Reference specific data points.`;

  if (ctx) {
    prompt += `\n\n## Current Market Context:\n`;
    if (ctx.symbol) prompt += `- Symbol: ${ctx.symbol}\n`;
    if (ctx.price != null) prompt += `- Price: $${ctx.price.toFixed(2)}\n`;
    if (ctx.changePercent != null) prompt += `- Change: ${ctx.changePercent >= 0 ? "+" : ""}${ctx.changePercent.toFixed(2)}%\n`;
    if (ctx.volume != null) prompt += `- Volume: ${(ctx.volume / 1e6).toFixed(1)}M\n`;
    if (ctx.pe != null) prompt += `- P/E: ${ctx.pe.toFixed(2)}\n`;
    if (ctx.marketCap != null) prompt += `- Market Cap: $${(ctx.marketCap / 1e9).toFixed(2)}B\n`;
    if (ctx.high52w != null) prompt += `- 52W High: $${ctx.high52w.toFixed(2)}\n`;
    if (ctx.low52w != null) prompt += `- 52W Low: $${ctx.low52w.toFixed(2)}\n`;
    if (ctx.sector) prompt += `- Sector: ${ctx.sector}\n`;
    if (ctx.industry) prompt += `- Industry: ${ctx.industry}\n`;

    if (ctx.recentPrices?.length) {
      prompt += `\n### Recent Prices (last ${ctx.recentPrices.length} days):\n`;
      for (const p of ctx.recentPrices.slice(-10)) {
        prompt += `- ${p.date}: $${p.close.toFixed(2)}\n`;
      }
    }

    if (ctx.news?.length) {
      prompt += `\n### Recent News:\n`;
      for (const n of ctx.news.slice(0, 5)) {
        prompt += `- [${n.source ?? "Unknown"}] ${n.title} (${n.date})\n`;
      }
    }

    if (ctx.financials?.length) {
      prompt += `\n### Financial Statements:\n`;
      for (const f of ctx.financials) {
        prompt += `- ${f.period}: Revenue $${((f.revenue ?? 0) / 1e9).toFixed(2)}B, Net Income $${((f.netIncome ?? 0) / 1e9).toFixed(2)}B, EPS $${(f.eps ?? 0).toFixed(2)}\n`;
      }
    }

    if (ctx.economicIndicators?.length) {
      prompt += `\n### Economic Indicators:\n`;
      for (const e of ctx.economicIndicators) {
        prompt += `- ${e.name}: ${e.value}${e.unit === "%" ? "%" : e.unit === "USD" ? " USD" : ""}\n`;
      }
    }

    if (ctx.marketOverview?.length) {
      prompt += `\n### Market Overview:\n`;
      for (const m of ctx.marketOverview) {
        prompt += `- ${m.symbol}: $${(m.price ?? 0).toFixed(2)} (${m.changePercent != null ? (m.changePercent >= 0 ? "+" : "") + m.changePercent.toFixed(2) + "%" : "N/A"})\n`;
      }
    }
  }

  return prompt;
}

export async function streamChat(
  messages: ChatMessage[],
  ctx?: MarketContext,
  onChunk?: (text: string) => void
): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error("No Groq API key configured. Add one in Settings.");

  const systemMessage: ChatMessage = {
    role: "system",
    content: buildSystemPrompt(ctx),
  };

  const allMessages = [systemMessage, ...messages];

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getGroqModel(),
      messages: allMessages,
      temperature: 0.3,
      max_tokens: 2048,
      stream: !!onChunk,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `API error ${res.status}`);
  }

  if (!onChunk) {
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "No response";
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content ?? "";
        if (token) {
          full += token;
          onChunk(full);
        }
      } catch {}
    }
  }

  return full;
}
