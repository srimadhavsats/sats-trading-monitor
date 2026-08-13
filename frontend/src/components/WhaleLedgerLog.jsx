import { useState, useEffect } from "react";
import { CONFIG } from "../config";
import { useTelemetry } from "../context/useTelemetry";
import { formatMarketPrice, formatCompactVolume } from "../utils/formatters";

const WhaleLedgerLog = () => {
  const { playWhaleChime } = useTelemetry();
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSymbol, setFilterSymbol] = useState("ALL");

  useEffect(() => {
    let isMounted = true;

    const fetchLedger = async () => {
      try {
        const baseUrl = CONFIG.BACKEND_URL.endsWith("/")
          ? CONFIG.BACKEND_URL.slice(0, -1)
          : CONFIG.BACKEND_URL;

        const response = await fetch(`${baseUrl}/metrics/whales`);
        if (!response.ok) throw new Error("Ledger channel degraded");

        const data = await response.json();
        if (isMounted) {
          setLedger([...data].reverse());
        }
      } catch (err) {
        console.error("[Whale Ledger] Fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLedger();
    const pollInterval = setInterval(fetchLedger, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  const filteredLedger =
    filterSymbol === "ALL"
      ? ledger
      : ledger.filter((item) =>
          item.symbol.toUpperCase().includes(filterSymbol.replace("-", "").replace("/", ""))
        );

  const getSeverityBadge = (volume) => {
    if (volume >= 50000000) {
      return (
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-400 border border-rose-800/60 animate-pulse">
          MEGA WHALE
        </span>
      );
    } else if (volume >= 15000000) {
      return (
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-400 border border-amber-800/60">
          HEAVY ACCUMULATION
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-950/70 text-blue-400 border border-blue-800/60">
        LARGE SPIKE
      </span>
    );
  };

  return (
    <div className="w-full p-5 rounded-2xl terminal-card font-mono flex flex-col gap-3 select-none">
      {/* Header with Title and Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a2333] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 live-dot" />
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
            Whale Liquidity Audit Tape
          </h3>
          <span className="text-[10px] text-slate-500 font-bold">
            ({filteredLedger.length} events)
          </span>
        </div>

        {/* Quick Filter */}
        <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-[#1b2438] text-[10px]">
          {["ALL", "BTC", "ETH", "SOL", "SATS"].map((key) => (
            <button
              key={key}
              onClick={() => setFilterSymbol(key)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                filterSymbol === key
                  ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Feed Rows */}
      <div className="max-h-[280px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar select-text">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Synchronizing Whale Tape Buffer...</span>
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            No whale transactions recorded in the current runtime window.
          </div>
        ) : (
          filteredLedger.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#090d16]/90 border border-[#1a2333] hover:border-slate-700 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-slate-500 font-bold tabular-nums">
                  [{event.timestamp}]
                </span>
                <span className="font-extrabold text-slate-200">
                  {event.symbol}
                </span>
                {getSeverityBadge(event.volume)}
              </div>

              <div className="flex items-center gap-3 tabular-nums">
                <span className="font-bold text-slate-300">
                  ${formatMarketPrice(event.price)}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                  {formatCompactVolume(event.volume)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-[#1a2333] pt-2">
        <span>Memory-Bounded Ring Buffer (20 Entries Max)</span>
        <button
          onClick={playWhaleChime}
          className="text-amber-400 hover:underline cursor-pointer font-bold"
        >
          🔊 Test Chime
        </button>
      </div>
    </div>
  );
};

export default WhaleLedgerLog;
