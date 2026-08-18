"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Panel } from "@/components/ui/panel";
import type { ChartRange } from "@/types";

const CHART_RANGES: ChartRange[] = ["1D", "5D", "1M", "6M", "1Y", "5Y", "MAX"];

export function SettingsContent() {
  const { settings, updateSettings } = useApp();
  const [saved, setSaved] = useState(false);
  const [density, setDensity] = useState(settings.density);
  const [uiMode, setUiMode] = useState(settings.uiMode);
  const [chartRange, setChartRange] = useState(settings.defaultChartRange);

  useEffect(() => {
    setDensity(settings.density);
    setUiMode(settings.uiMode);
    setChartRange(settings.defaultChartRange);
  }, [settings]);

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleDensityChange(value: "compact" | "comfortable") {
    setDensity(value);
    await updateSettings({ density: value });
    flashSaved();
  }

  async function handleUiModeChange(value: "explorer" | "terminal") {
    setUiMode(value);
    await updateSettings({ uiMode: value });
    flashSaved();
  }

  async function handleChartRangeChange(value: ChartRange) {
    setChartRange(value);
    await updateSettings({ defaultChartRange: value });
    flashSaved();
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
        {saved && (
          <span className="text-[11px] font-mono text-green-400 border border-green-500/20 bg-green-500/10 px-2 py-0.5 rounded animate-pulse">
            Saved
          </span>
        )}
      </div>

      {/* Appearance */}
      <Panel title="Appearance">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Theme</label>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                <div className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-700" />
                Dark
              </div>
              <span className="text-[11px] text-zinc-600">Only option for V1</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Density</label>
            <div className="flex gap-2">
              {(["compact", "comfortable"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDensityChange(d)}
                  className={`px-3 py-1.5 text-[13px] font-mono border rounded transition-colors capitalize ${
                    density === d
                      ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* Interface */}
      <Panel title="Interface">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">UI Mode</label>
            <div className="flex gap-2">
              {(["explorer", "terminal"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleUiModeChange(mode)}
                  className={`px-3 py-1.5 text-[13px] font-mono border rounded transition-colors capitalize ${
                    uiMode === mode
                      ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  {mode} Mode
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Default Chart Range</label>
            <div className="flex flex-wrap gap-2">
              {CHART_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => handleChartRangeChange(range)}
                  className={`px-3 py-1.5 text-[13px] font-mono border rounded transition-colors ${
                    chartRange === range
                      ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* About */}
      <Panel title="About">
        <div className="space-y-3 font-mono text-[13px]">
          <div className="flex justify-between items-baseline">
            <span className="text-zinc-500">App</span>
            <span className="text-zinc-200 font-bold tracking-wider">ATLAS</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-zinc-500">Version</span>
            <span className="text-zinc-200">1.0.0</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-zinc-500">Data</span>
            <span className="text-zinc-300 font-mono text-[12px]">Live</span>
          </div>
          <div className="border-t border-zinc-800 pt-3">
            <p className="text-zinc-400 text-[12px] leading-relaxed">
              A local financial intelligence terminal for exploring markets, companies, and economic data.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
