"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { AppSettings, UIMode, Density } from "@/types";

interface AppContextValue {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleMode: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const defaultSettings: AppSettings = {
  theme: "dark",
  density: "compact",
  uiMode: "explorer",
  defaultWatchlistId: null,
  defaultChartRange: "1M",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});

    try {
      const saved = localStorage.getItem("atlas_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("atlas_sidebar_collapsed", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setSettings(data);
  }, []);

  const toggleMode = useCallback(() => {
    const newMode: UIMode = settings.uiMode === "explorer" ? "terminal" : "explorer";
    updateSettings({ uiMode: newMode });
  }, [settings.uiMode, updateSettings]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        commandOpen,
        setCommandOpen,
        toggleMode,
        sidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}


export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useDensityClass() {
  const { settings } = useApp();
  return settings.density === "compact" ? "gap-2 p-3" : "gap-3 p-4";
}

export function useExplorerMode() {
  const { settings } = useApp();
  return settings.uiMode === "explorer";
}
