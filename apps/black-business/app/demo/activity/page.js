"use client";

import { useEffect, useState, useCallback } from "react";

const CATEGORY_STYLES = {
  RLUSD: { bg: "bg-emerald-100", text: "text-emerald-800", icon: "$" },
  MPT: { bg: "bg-amber-100", text: "text-amber-800", icon: "M" },
  XRP: { bg: "bg-blue-100", text: "text-blue-800", icon: "X" },
  Trustline: { bg: "bg-purple-100", text: "text-purple-800", icon: "T" },
  Credential: { bg: "bg-rose-100", text: "text-rose-800", icon: "C" },
  Other: { bg: "bg-gray-100", text: "text-gray-600", icon: "?" },
};

const CATEGORY_FILTERS = ["All", "RLUSD", "MPT", "XRP", "Trustline", "Credential"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function CategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/60">
        {style.icon}
      </span>
      {category}
    </span>
  );
}

function ResultBadge({ result }) {
  if (result === "tesSUCCESS") {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-green-100 text-green-700">
        SUCCESS
      </span>
    );
  }
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-100 text-red-700">
      {result}
    </span>
  );
}

function TxRow({ tx, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const explorerUrl = `https://devnet.xrpl.org/transactions/${tx.hash}`;

  return (
    <div
      className={`border-b border-[var(--line)] transition-all duration-500 ${
        isNew ? "bg-emerald-50/60 animate-pulse-once" : ""
      }`}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/40"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Timestamp */}
        <div className="w-20 shrink-0 text-xs text-[var(--muted)] font-mono">
          {timeAgo(tx.date)}
        </div>

        {/* Category */}
        <div className="w-28 shrink-0">
          <CategoryBadge category={tx.category} />
        </div>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{tx.description}</p>
        </div>

        {/* Value */}
        <div className="w-32 shrink-0 text-right">
          {tx.value && (
            <span className="text-sm font-semibold font-mono">
              {tx.currency === "RLUSD" && "$"}
              {tx.value}
              {tx.currency === "XRP" && " XRP"}
              {tx.currency === "BBS (MPT)" && " pts"}
            </span>
          )}
        </div>

        {/* Result */}
        <div className="w-20 shrink-0 text-right">
          <ResultBadge result={tx.result} />
        </div>

        {/* Expand */}
        <div className="w-6 shrink-0 text-center text-xs text-[var(--muted)]">
          {expanded ? "\u25B2" : "\u25BC"}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 pt-0 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-[var(--muted)] bg-white/30">
          <div>
            <span className="font-semibold text-[var(--ink)]">Tx Type:</span>{" "}
            {tx.txType}
          </div>
          <div>
            <span className="font-semibold text-[var(--ink)]">Ledger:</span>{" "}
            {tx.ledgerIndex || "N/A"}
          </div>
          <div>
            <span className="font-semibold text-[var(--ink)]">From:</span>{" "}
            {tx.senderLabel}
            {tx.sender && (
              <span className="ml-1 font-mono text-[10px]">
                ({tx.sender.slice(0, 10)}...)
              </span>
            )}
          </div>
          <div>
            <span className="font-semibold text-[var(--ink)]">To:</span>{" "}
            {tx.destinationLabel || "N/A"}
            {tx.destination && (
              <span className="ml-1 font-mono text-[10px]">
                ({tx.destination.slice(0, 10)}...)
              </span>
            )}
          </div>
          <div className="col-span-2">
            <span className="font-semibold text-[var(--ink)]">Hash:</span>{" "}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[var(--accent)] hover:underline break-all"
            >
              {tx.hash}
            </a>
          </div>
          {tx.date && (
            <div className="col-span-2">
              <span className="font-semibold text-[var(--ink)]">Time:</span>{" "}
              {new Date(tx.date).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DemoActivityPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [prevHashes, setPrevHashes] = useState(new Set());

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/demo/activity?limit=100");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchActivity, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchActivity]);

  // Track new transactions for highlight
  useEffect(() => {
    if (data?.transactions) {
      const currentHashes = new Set(data.transactions.map((t) => t.hash));
      setPrevHashes(currentHashes);
    }
  }, [data]);

  const filtered =
    data?.transactions?.filter((tx) => filter === "All" || tx.category === filter) || [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-[var(--bg)]/80 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Fraunces, serif" }}
              >
                XRPL Activity Log
              </h1>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                Real-time on-chain transactions across all platform accounts
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  autoRefresh
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
                />
                {autoRefresh ? "Live" : "Paused"}
              </button>
              {/* Manual refresh */}
              <button
                onClick={() => {
                  setLoading(true);
                  fetchActivity();
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/60 border border-[var(--line)] hover:bg-white/80 transition-colors"
              >
                Refresh
              </button>
              {lastRefresh && (
                <span className="text-[10px] text-[var(--muted)]">
                  {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Account summary cards */}
          {data?.accounts && (
            <div className="flex gap-3 mt-3">
              {data.accounts.map((acct) => (
                <div
                  key={acct.address}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 border border-[var(--line)] text-xs"
                >
                  <span className="font-semibold">{acct.account}</span>
                  <span className="text-[var(--muted)] font-mono">
                    {acct.address.slice(0, 8)}...
                  </span>
                  <span className="ml-auto font-mono text-[var(--accent)]">
                    {acct.txCount} txs
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Category filters */}
          <div className="flex gap-2 mt-3">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === cat
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white/50 text-[var(--muted)] border border-[var(--line)] hover:bg-white/80"
                }`}
              >
                {cat}
                {cat !== "All" && data?.categoryCounts?.[cat] != null && (
                  <span className="ml-1 opacity-70">({data.categoryCounts[cat]})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {loading && !data && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-[var(--muted)]">
              Connecting to XRPL Devnet...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            Failed to load activity: {error}
          </div>
        )}

        {data && filtered.length === 0 && (
          <div className="text-center py-16 text-[var(--muted)]">
            <p className="text-lg">No transactions found</p>
            <p className="text-sm mt-1">
              {filter !== "All"
                ? `No ${filter} transactions. Try a different filter.`
                : "Platform accounts have no transaction history yet."}
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden shadow-sm">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/40 border-b border-[var(--line)] text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
              <div className="w-20 shrink-0">Time</div>
              <div className="w-28 shrink-0">Type</div>
              <div className="flex-1">Description</div>
              <div className="w-32 shrink-0 text-right">Value</div>
              <div className="w-20 shrink-0 text-right">Result</div>
              <div className="w-6 shrink-0" />
            </div>

            {/* Rows */}
            {filtered.map((tx) => (
              <TxRow
                key={tx.hash}
                tx={tx}
                isNew={!prevHashes.has(tx.hash) && prevHashes.size > 0}
              />
            ))}
          </div>
        )}

        {/* Stats footer */}
        {data && (
          <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted)]">
            <span>
              Showing {filtered.length} of {data.totalTransactions} transactions
            </span>
            <span>
              Network: XRPL Devnet | Auto-refresh: {autoRefresh ? "8s" : "off"}
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-once {
          0% { background-color: rgba(16, 185, 129, 0.15); }
          100% { background-color: transparent; }
        }
        .animate-pulse-once {
          animation: pulse-once 2s ease-out;
        }
      `}</style>
    </div>
  );
}
