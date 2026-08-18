"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Database, RefreshCw, CheckCircle2, AlertCircle, Wifi } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import type { ImportResult } from "@/types";

interface ImportStats {
  recordsImported: number;
  recordsRejected: number;
  lastUpdated: string | null;
}

interface SyncStatus {
  name: string;
  type: string;
  lastSyncAt: string | null;
  recordCount: number;
}

interface DatabaseStats {
  companies: number;
  securities: number;
  prices: number;
  financialStatements: number;
  economicIndicators: number;
  news: number;
  watchlists: number;
}

type DatasetType = "companies" | "prices" | "economic" | "news";

interface DataSourceCard {
  id: string;
  name: string;
  description: string;
  action: string;
  icon: string;
}

const DATA_SOURCES: DataSourceCard[] = [
  {
    id: "yahoo",
    name: "Yahoo Finance",
    description: "Company data, prices, financial statements",
    action: "syncAll",
    icon: "Y",
  },
  {
    id: "coingecko",
    name: "CoinGecko",
    description: "Crypto market data, prices",
    action: "syncCrypto",
    icon: "C",
  },
  {
    id: "fred",
    name: "FRED",
    description: "Economic indicators",
    action: "syncEconomic",
    icon: "F",
  },
  {
    id: "manual",
    name: "Manual Import",
    description: "CSV/JSON file upload",
    action: "import",
    icon: "M",
  },
];

export function DataCenterContent() {
  const [datasetType] = useState<DatasetType>("companies");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [syncingSources, setSyncingSources] = useState<Set<string>>(new Set());
  const [syncResults, setSyncResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/data/sync/status");
      const data = await res.json();
      setSyncStatuses(data.sources ?? []);
      setDbStats(data.stats ?? null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchStatus();
      try {
        const res = await fetch("/api/data/import");
        const d = await res.json();
        setStats({
          recordsImported: d.recordsImported ?? 0,
          recordsRejected: d.recordsRejected ?? 0,
          lastUpdated: d.lastUpdated ?? null,
        });
      } catch {
        // ignore
      }
    };
    void load();
  }, [fetchStatus, importing]);

  async function handleSync(action: string) {
    setSyncingSources((prev) => new Set(prev).add(action));
    setSyncResults((prev) => ({ ...prev, [action]: { success: true, message: "Syncing..." } }));

    try {
      const res = await fetch("/api/data/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const allSuccess = data.every((r: { success: boolean }) => r.success);
        const totalSynced = data.reduce((sum: number, r: { recordsSynced: number }) => sum + r.recordsSynced, 0);
        setSyncResults((prev) => ({
          ...prev,
          [action]: {
            success: allSuccess,
            message: allSuccess ? `Synced ${totalSynced} records` : "Sync completed with errors",
          },
        }));
      } else {
        setSyncResults((prev) => ({
          ...prev,
          [action]: {
            success: data.success ?? false,
            message: data.success ? `Synced ${data.recordsSynced ?? 0} records` : "Sync failed",
          },
        }));
      }

      fetchStatus();
    } catch {
      setSyncResults((prev) => ({
        ...prev,
        [action]: { success: false, message: "Sync request failed" },
      }));
    } finally {
      setSyncingSources((prev) => {
        const next = new Set(prev);
        next.delete(action);
        return next;
      });
    }
  }

  async function handleSyncAll() {
    setSyncingSources((prev) => new Set(prev).add("syncAll"));
    try {
      await fetch("/api/data/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncAll" }),
      });
      fetchStatus();
    } catch {
      // ignore
    } finally {
      setSyncingSources((prev) => {
        const next = new Set(prev);
        next.delete("syncAll");
        return next;
      });
    }
  }

  async function handleImport() {
    if (!selectedFile) return;
    setImporting(true);
    setLastResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("datasetType", datasetType);
      formData.append("format", selectedFile.name.endsWith(".json") ? "json" : "csv");

      const res = await fetch("/api/data/import", {
        method: "POST",
        body: formData,
      });
      const data: ImportResult = await res.json();
      setLastResult(data);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setLastResult({ recordsImported: 0, recordsRejected: 0, errors: ["Import request failed"] });
    } finally {
      setImporting(false);
    }
  }

  function formatTime(ts: string | null): string {
    if (!ts) return "Never";
    try {
      const d = new Date(ts);
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } catch {
      return ts;
    }
  }

  function formatDateTime(ts: string | null): string {
    if (!ts) return "Never";
    try {
      const d = new Date(ts);
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } catch {
      return ts;
    }
  }

  function formatNumberCommas(n: number): string {
    return n.toLocaleString("en-US");
  }

  function getSourceStatus(name: string): "synced" | "stale" | "never" {
    const source = syncStatuses.find((s) => s.name === name);
    if (!source?.lastSyncAt) return "never";
    const lastSync = new Date(source.lastSyncAt);
    const today = new Date();
    const isToday = lastSync.toDateString() === today.toDateString();
    return isToday ? "synced" : "stale";
  }

  function getSourceRecordCount(name: string): number {
    const source = syncStatuses.find((s) => s.name === name);
    return source?.recordCount ?? 0;
  }

  function getStatusDot(status: "synced" | "stale" | "never") {
    switch (status) {
      case "synced":
        return <span className="inline-block w-2 h-2 rounded-full bg-green-500" />;
      case "stale":
        return <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />;
      case "never":
        return <span className="inline-block w-2 h-2 rounded-full bg-zinc-600" />;
    }
  }

  function getSourceLastSync(name: string): string {
    const source = syncStatuses.find((s) => s.name === name);
    return source?.lastSyncAt ?? "";
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">Data Center</h1>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncingSources.has("syncAll")}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {syncingSources.has("syncAll") ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          {syncingSources.has("syncAll") ? "Syncing All..." : "Sync All"}
        </button>
      </div>

      {/* Section 1: Live Data Sources */}
      <Panel title="Live Data Sources">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DATA_SOURCES.map((source) => {
            const status = getSourceStatus(source.name === "Manual Import" ? "" : source.name);
            const recordCount = getSourceRecordCount(source.name === "Manual Import" ? "" : source.name);
            const lastSync = getSourceLastSync(source.name === "Manual Import" ? "" : source.name);
            const isSyncing = syncingSources.has(source.action);
            const syncResult = syncResults[source.action];

            return (
              <div
                key={source.id}
                className="border border-zinc-800 bg-zinc-900/50 rounded p-3 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
                    {source.icon}
                  </div>
                  <span className="text-[13px] font-semibold text-zinc-200">{source.name}</span>
                  {source.action !== "import" && getStatusDot(status)}
                </div>

                <p className="text-[11px] text-zinc-500 mb-3 flex-1">{source.description}</p>

                {source.action === "import" ? (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                      className="w-full text-[11px] text-zinc-400 file:mr-2 file:py-1 file:px-2 file:text-[10px] file:font-medium file:bg-zinc-800 file:text-zinc-300 file:border file:border-zinc-700 file:rounded file:cursor-pointer hover:file:bg-zinc-700 file:transition-colors"
                    />
                    <button
                      onClick={handleImport}
                      disabled={!selectedFile || importing}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Upload size={11} />
                      {importing ? "Importing..." : "Import File"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSync(source.action)}
                    disabled={isSyncing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? (
                      <RefreshCw size={11} className="animate-spin" />
                    ) : (
                      <Wifi size={11} />
                    )}
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </button>
                )}

                {source.action !== "import" && (
                  <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Last: {lastSync ? formatTime(lastSync) : "Never"}</span>
                    <span>Records: {formatNumberCommas(recordCount)}</span>
                  </div>
                )}

                {syncResult && !isSyncing && (
                  <div className={`mt-2 text-[10px] ${syncResult.success ? "text-green-400" : "text-red-400"}`}>
                    {syncResult.success ? <CheckCircle2 size={10} className="inline mr-1" /> : <AlertCircle size={10} className="inline mr-1" />}
                    {syncResult.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Section 2: Database Stats */}
      <Panel title="Database Stats">
        {dbStats ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Table</th>
                  <th className="text-right py-2 px-4 text-zinc-400 font-medium">Records</th>
                  <th className="text-right py-2 pl-4 text-zinc-400 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-300">Companies</td>
                  <td className="py-2 px-4 text-right text-zinc-200">{formatNumberCommas(dbStats.companies)}</td>
                  <td className="py-2 pl-4 text-right text-zinc-500">
                    {formatDateTime(syncStatuses.find((s) => s.type === "companies")?.lastSyncAt ?? null)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-300">Securities</td>
                  <td className="py-2 px-4 text-right text-zinc-200">{formatNumberCommas(dbStats.securities)}</td>
                  <td className="py-2 pl-4 text-right text-zinc-500">—</td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-300">Prices</td>
                  <td className="py-2 px-4 text-right text-zinc-200">{formatNumberCommas(dbStats.prices)}</td>
                  <td className="py-2 pl-4 text-right text-zinc-500">
                    {formatDateTime(syncStatuses.find((s) => s.type === "prices")?.lastSyncAt ?? null)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-300">Financial Statements</td>
                  <td className="py-2 px-4 text-right text-zinc-200">{formatNumberCommas(dbStats.financialStatements)}</td>
                  <td className="py-2 pl-4 text-right text-zinc-500">
                    {formatDateTime(syncStatuses.find((s) => s.type === "financials")?.lastSyncAt ?? null)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-300">Economic Indicators</td>
                  <td className="py-2 px-4 text-right text-zinc-200">{formatNumberCommas(dbStats.economicIndicators)}</td>
                  <td className="py-2 pl-4 text-right text-zinc-500">
                    {formatDateTime(syncStatuses.find((s) => s.type === "economic")?.lastSyncAt ?? null)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-300">News</td>
                  <td className="py-2 px-4 text-right text-zinc-200">{formatNumberCommas(dbStats.news)}</td>
                  <td className="py-2 pl-4 text-right text-zinc-500">
                    {formatDateTime(syncStatuses.find((s) => s.type === "news")?.lastSyncAt ?? null)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-zinc-300">Watchlists</td>
                  <td className="py-2 px-4 text-right text-zinc-200">{formatNumberCommas(dbStats.watchlists)}</td>
                  <td className="py-2 pl-4 text-right text-zinc-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-500 text-[12px]">Loading stats...</div>
        )}
      </Panel>

      {/* Section 3: Import Stats */}
      <Panel title="Import Stats">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-zinc-800 bg-zinc-900/50 rounded p-3">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Total Records Imported</div>
            <div className="text-lg font-mono text-zinc-200">
              {stats ? formatNumberCommas(stats.recordsImported) : "—"}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/50 rounded p-3">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Records Rejected (Last)</div>
            <div className="text-lg font-mono text-zinc-200">
              {stats ? formatNumberCommas(stats.recordsRejected) : "—"}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/50 rounded p-3">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Last Updated</div>
            <div className="text-lg font-mono text-zinc-200">
              {stats?.lastUpdated ? formatTime(stats.lastUpdated) : "Never"}
            </div>
          </div>
        </div>

        {lastResult && (
          <div className="mt-3 border-t border-zinc-800 pt-3 space-y-1 font-mono text-[12px]">
            <div className="text-zinc-300">
              Records imported: <span className="text-green-400">{formatNumberCommas(lastResult.recordsImported)}</span>
            </div>
            <div className="text-zinc-300">
              Records rejected: <span className="text-amber-400">{formatNumberCommas(lastResult.recordsRejected)}</span>
            </div>
            {lastResult.errors.length > 0 && (
              <div className="text-red-400 text-[11px] mt-1 space-y-0.5">
                {lastResult.errors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Section 4: Supported Formats */}
      <Panel title="Supported Formats">
        <div className="font-mono text-[12px] text-zinc-500 space-y-2">
          <div className="flex items-center gap-2">
            <Database size={13} className="text-zinc-600" />
            <span>CSV — comma-separated values, first row is headers</span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={13} className="text-zinc-600" />
            <span>JSON — array of objects, keys match CSV columns</span>
          </div>
          <div className="mt-3 border-t border-zinc-800 pt-3 text-[11px] text-zinc-600">
            Companies: name, ticker, exchange, sector, industry, country, description
          </div>
          <div className="text-[11px] text-zinc-600">
            Prices: symbol, timestamp, open, high, low, close, volume
          </div>
          <div className="text-[11px] text-zinc-600">
            Economic: name, country, timestamp, value, unit, source, category
          </div>
          <div className="text-[11px] text-zinc-600">
            News: title, summary, source, url, published_at, symbol
          </div>
        </div>
      </Panel>
    </div>
  );
}
