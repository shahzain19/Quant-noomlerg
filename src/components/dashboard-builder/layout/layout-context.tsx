"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

export interface LayoutPanel {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

interface LayoutContextValue {
  panels: LayoutPanel[];
  cols: number;
  rowH: number;
  gap: number;
  colW: number;
  addPanel: (type: string, config?: Record<string, unknown>) => void;
  removePanel: (id: string) => void;
  movePanel: (id: string, x: number, y: number) => void;
  resizePanel: (id: string, w: number, h: number) => void;
  updatePanelConfig: (id: string, config: Record<string, unknown>) => void;
  getPixelLayout: () => Map<string, { left: number; top: number; width: number; height: number }>;
  containerWidth: number;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}

const STORAGE_KEY = "atlas-dashboard-layout";

const DEFAULT_LAYOUT: LayoutPanel[] = [
  { id: "chart-1", type: "chart", x: 0, y: 0, w: 8, h: 4, config: { symbol: "AAPL", range: "1M" } },
  { id: "movers-1", type: "movers", x: 8, y: 0, w: 4, h: 4 },
  { id: "news-1", type: "news", x: 0, y: 4, w: 4, h: 3 },
  { id: "watchlist-1", type: "watchlist", x: 4, y: 4, w: 4, h: 3 },
  { id: "economic-1", type: "economic", x: 8, y: 4, w: 4, h: 3 },
];

function loadLayout(): LayoutPanel[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LAYOUT;
}

function saveLayout(panels: LayoutPanel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
  } catch {}
}

function findFreeSpot(panels: LayoutPanel[], pw: number, ph: number, cols: number): { x: number; y: number } {
  const maxY = panels.reduce((m, p) => Math.max(m, p.y + p.h), 0);
  const occupied = new Set<string>();
  for (const p of panels) {
    for (let dx = 0; dx < p.w; dx++) {
      for (let dy = 0; dy < p.h; dy++) {
        occupied.add(`${p.x + dx},${p.y + dy}`);
      }
    }
  }
  for (let y = 0; y <= maxY + 1; y++) {
    for (let x = 0; x <= cols - pw; x++) {
      let fits = true;
      for (let dx = 0; dx < pw && fits; dx++) {
        for (let dy = 0; dy < ph && fits; dy++) {
          if (occupied.has(`${x + dx},${y + dy}`)) fits = false;
        }
      }
      if (fits) return { x, y };
    }
  }
  return { x: 0, y: maxY + 1 };
}

function calcPixelLayout(
  panels: LayoutPanel[],
  colW: number,
  rowH: number,
  gap: number
): Map<string, { left: number; top: number; width: number; height: number }> {
  const map = new Map<string, { left: number; top: number; width: number; height: number }>();
  if (colW <= 0) return map;
  for (const p of panels) {
    map.set(p.id, {
      left: p.x * (colW + gap),
      top: p.y * (rowH + gap),
      width: p.w * colW + Math.max(0, p.w - 1) * gap,
      height: p.h * rowH + Math.max(0, p.h - 1) * gap,
    });
  }
  return map;
}

const HEADER_HEIGHT = 56;

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [panels, setPanels] = useState<LayoutPanel[]>(() => {
    if (typeof window === "undefined") return DEFAULT_LAYOUT;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_LAYOUT;
  });
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cols = 12;
  const rowH = 60;
  const gap = 8;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    saveLayout(panels);
  }, [panels]);

  const colW = containerWidth > 0 ? (containerWidth - gap * (cols - 1)) / cols : 0;

  const addPanel = useCallback(
    (type: string, config?: Record<string, unknown>) => {
      const defaults: Record<string, { w: number; h: number }> = {
        chart: { w: 6, h: 4 },
        "mini-chart": { w: 3, h: 3 },
        movers: { w: 4, h: 4 },
        news: { w: 4, h: 3 },
        watchlist: { w: 4, h: 3 },
        economic: { w: 4, h: 3 },
        market: { w: 6, h: 2 },
        companies: { w: 4, h: 4 },
        fundamentals: { w: 5, h: 4 },
        valuation: { w: 3, h: 4 },
        financials: { w: 8, h: 4 },
        rsi: { w: 6, h: 2 },
        macd: { w: 6, h: 2 },
        commodities: { w: 4, h: 3 },
        currencies: { w: 4, h: 3 },
        heatmap: { w: 8, h: 3 },
        sectors: { w: 5, h: 4 },
        "price-levels": { w: 3, h: 4 },
        volume: { w: 6, h: 2 },
        earnings: { w: 5, h: 4 },
        "ai-assistant": { w: 5, h: 5 },
        "yield-curve": { w: 8, h: 3 },
        "macro-calendar": { w: 5, h: 5 },
        insider: { w: 5, h: 4 },
        filings: { w: 5, h: 4 },
      };
      const d = defaults[type] ?? { w: 4, h: 3 };
      const spot = findFreeSpot(panels, d.w, d.h, cols);
      const newPanel: LayoutPanel = {
        id: `${type}-${Date.now()}`,
        type,
        x: spot.x,
        y: spot.y,
        w: d.w,
        h: d.h,
        config: config ?? {},
      };
      setPanels((prev) => [...prev, newPanel]);
    },
    [panels, cols]
  );

  const removePanel = useCallback((id: string) => {
    setPanels((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const movePanel = useCallback((id: string, x: number, y: number) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x: Math.max(0, Math.min(cols - p.w, x)), y: Math.max(0, y) } : p))
    );
  }, [cols]);

  const resizePanel = useCallback((id: string, w: number, h: number) => {
    setPanels((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, w: Math.max(2, Math.min(cols - p.x, w)), h: Math.max(1, h) }
          : p
      )
    );
  }, [cols]);

  const updatePanelConfig = useCallback((id: string, config: Record<string, unknown>) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, config: { ...p.config, ...config } } : p)));
  }, []);

  const getPixelLayout = useCallback(
    () => calcPixelLayout(panels, colW, rowH, gap),
    [panels, colW, rowH, gap]
  );

  const totalRows = panels.reduce((m, p) => Math.max(m, p.y + p.h), 0);
  const totalHeight = totalRows * rowH + Math.max(0, totalRows - 1) * gap;

  return (
    <LayoutContext.Provider
      value={{
        panels,
        cols,
        rowH,
        gap,
        colW,
        addPanel,
        removePanel,
        movePanel,
        resizePanel,
        updatePanelConfig,
        getPixelLayout,
        containerWidth,
      }}
    >
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: totalHeight + HEADER_HEIGHT + 8, minHeight: 100, paddingTop: HEADER_HEIGHT }}
      >
        {children}
      </div>
    </LayoutContext.Provider>
  );
}
