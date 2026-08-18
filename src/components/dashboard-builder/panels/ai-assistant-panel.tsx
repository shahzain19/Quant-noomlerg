"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Settings, Trash2, Bot, User, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamChat, getGroqApiKey, setGroqApiKey, getGroqModel, setGroqModel, GROQ_MODELS, type ChatMessage, type MarketContext, type GroqModelId } from "@/lib/ai/groq";
import { useLayout } from "../layout/layout-context";
import { cn } from "@/lib/utils";

export function AiAssistantPanel({ id }: { id: string }) {
  const { panels, updatePanelConfig } = useLayout();
  const panel = panels.find((p) => p.id === id);
  const symbol = (panel?.config?.symbol as string) ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKeyState] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GroqModelId>(getGroqModel());
  const [marketCtx, setMarketCtx] = useState<MarketContext>({});
  const [symbolInput, setSymbolInput] = useState(symbol);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = getGroqApiKey();
    setHasKey(!!key);
    setApiKeyState(key ?? "");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const loadMarketContext = useCallback(async (sym: string) => {
    if (!sym) return;
    try {
      const [companyRes, pricesRes, financialsRes] = await Promise.all([
        fetch(`/api/companies/${encodeURIComponent(sym)}`).then((r) => r.json()),
        fetch(`/api/companies/${encodeURIComponent(sym)}/prices?range=1M`).then((r) => r.json()),
        fetch(`/api/companies/${encodeURIComponent(sym)}/financials?periodType=annual`).then((r) => r.json()),
      ]);

      const recentPrices = (pricesRes ?? []).slice(-10).map((p: any) => ({
        date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        close: p.close,
      }));

      const financials = (financialsRes ?? []).slice(0, 4).map((f: any) => ({
        period: f.period,
        revenue: f.revenue,
        netIncome: f.netIncome,
        eps: f.eps,
      }));

      setMarketCtx({
        symbol: companyRes.ticker ?? sym,
        price: companyRes.quote?.price,
        change: companyRes.quote?.change,
        changePercent: companyRes.quote?.changePercent,
        volume: companyRes.quote?.volume,
        pe: companyRes.peRatio,
        marketCap: companyRes.marketCap,
        high52w: companyRes.high52w,
        low52w: companyRes.low52w,
        sector: companyRes.sector,
        industry: companyRes.industry,
        recentPrices,
        financials,
      });
    } catch {}
  }, []);

  const handleSymbolSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const sym = symbolInput.trim().toUpperCase();
      if (sym) {
        updatePanelConfig(id, { symbol: sym });
        loadMarketContext(sym);
      }
    },
    [id, symbolInput, updatePanelConfig, loadMarketContext]
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;
    if (!hasKey) { setShowSettings(true); return; }

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setStreamText("");

    try {
      const response = await streamChat(newMessages, marketCtx, (text) => {
        setStreamText(text);
      });
      setMessages([...newMessages, { role: "assistant", content: response }]);
      setStreamText("");
    } catch (err: any) {
      setMessages([...newMessages, { role: "assistant", content: `Error: ${err.message}` }]);
      setStreamText("");
    }
    setStreaming(false);
  }, [input, streaming, hasKey, messages, marketCtx]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      setGroqApiKey(apiKey.trim());
      setHasKey(true);
      setShowSettings(false);
    }
  };

  const handleModelChange = (modelId: GroqModelId) => {
    setSelectedModel(modelId);
    setGroqModel(modelId);
  };

  const handleClearChat = () => {
    setMessages([]);
    setStreamText("");
  };

  const suggestedQuestions = [
    "Analyze this stock's fundamentals",
    "What are the key risks?",
    "Compare valuation to sector peers",
    "Summarize recent price action",
    "Is this a good entry point?",
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 pt-2 pb-1 border-b border-zinc-800/50">
        <form onSubmit={handleSymbolSubmit} className="flex items-center gap-1 flex-1">
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            className="px-2 py-0.5 text-[11px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-200 w-16 focus:outline-none focus:border-zinc-500"
            placeholder="Symbol"
          />
          {symbol && <span className="text-[10px] text-zinc-500">{symbol}</span>}
        </form>
        <button onClick={handleClearChat} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors" title="Clear chat">
          <Trash2 size={11} />
        </button>
        <button onClick={() => setShowSettings(!showSettings)} className={cn("p-1 transition-colors", showSettings ? "text-blue-400" : "text-zinc-600 hover:text-zinc-300")} title="Settings">
          <Settings size={11} />
        </button>
      </div>

      {showSettings && (
        <div className="px-2 py-2 border-b border-zinc-800 bg-zinc-900/50 space-y-2">
          <div>
            <div className="text-[10px] text-zinc-500 mb-1">Model</div>
            <div className="flex flex-wrap gap-1">
              {GROQ_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelChange(m.id)}
                  className={cn(
                    "px-2 py-0.5 text-[9px] rounded border transition-colors",
                    selectedModel === m.id
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="text-[9px] text-zinc-600 mt-0.5">{GROQ_MODELS.find((m) => m.id === selectedModel)?.speed} — {GROQ_MODELS.find((m) => m.id === selectedModel)?.cost}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 mb-1">Groq API Key</div>
            <div className="flex items-center gap-1">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                className="flex-1 px-2 py-0.5 text-[11px] bg-zinc-800 border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-zinc-500"
                placeholder="gsk_..."
              />
              <button onClick={handleSaveKey} className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">
                Save
              </button>
            </div>
            <div className="text-[9px] text-zinc-600 mt-1">Free at console.groq.com — stores locally only</div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto px-2 py-2 space-y-3">
        {!messages.length && !streamText && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Bot size={24} className="text-zinc-600" />
            <div className="text-[11px] text-zinc-500 text-center">
              {hasKey ? (
                <>
                  <p className="mb-2">ATLAS AI Assistant</p>
                  {!symbol && (
                    <p className="text-zinc-600">Enter a symbol above to load market context</p>
                  )}
                </>
              ) : (
                <p>Configure your Groq API key to start</p>
              )}
            </div>
            {hasKey && (
              <div className="space-y-1 w-full max-w-[250px]">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="w-full text-left px-2 py-1.5 text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={10} className="text-blue-400" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] px-2.5 py-1.5 rounded text-[11px] leading-relaxed",
                msg.role === "user"
                  ? "bg-blue-600/20 text-zinc-200 border border-blue-500/20"
                  : "bg-zinc-900 text-zinc-300 border border-zinc-800"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="ai-markdown"><Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown></div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <User size={10} className="text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {streamText && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={10} className="text-blue-400" />
            </div>
            <div className="max-w-[85%] px-2.5 py-1.5 rounded text-[11px] leading-relaxed bg-zinc-900 text-zinc-300 border border-zinc-800">
              <div className="ai-markdown"><Markdown remarkPlugins={[remarkGfm]}>{streamText}</Markdown></div>
              {streaming && <Loader2 size={10} className="inline animate-spin ml-1 text-blue-400" />}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-2 py-1.5 border-t border-zinc-800">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            className="flex-1 px-2 py-1 text-[11px] bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
            placeholder={hasKey ? "Ask about the market..." : "Configure API key first..."}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-30"
          >
            {streaming ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </form>
      </div>
    </div>
  );
}
