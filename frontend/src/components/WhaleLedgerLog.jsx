import React, { useState, useEffect } from "react";
import { CONFIG } from "../config";
import { formatMarketPrice, formatCompactVolume } from "../utils/formatters";

const WhaleLedgerLog = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const baseUrl =
          CONFIG.BACKEND_URL ||
          CONFIG.BACKEND_WS_URL.replace("ws://", "http://").replace("/ws", "");
        const response = await fetch(`${baseUrl}/metrics/whales`);
        if (!response.ok) throw new Error("Ledger feed channel degraded");

        const data = await response.json();
        // Reverse array to ensure the newest whale events render at the top of the stream
        setLedger([...data].reverse());
      } catch (err) {
        console.error("── 🐋 WHALE HISTORY FETCH FAULT ──", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
    const pollInterval = setInterval(fetchLedger, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  if (loading) {
    return (
      <div className="w-96 p-4 border border-neutral-800 rounded-xl bg-neutral-900/40 animate-pulse h-24 flex items-center justify-center">
        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600 font-mono">
          Syncing Whale Ledger Tape...
        </span>
      </div>
    );
  }

  return (
    <div className="w-96 p-5 border rounded-2xl bg-neutral-900/95 backdrop-blur-2xl border-neutral-800 font-mono flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 border-b border-neutral-800/60 pb-2">
        <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">
          Whale Liquidity Audit Log
        </h4>
        <p className="text-[7px] text-neutral-600 uppercase font-bold tracking-wider">
          Memory-bounded buffer tape streaming historical order metrics
        </p>
      </div>

      <div className="max-h-40 overflow-y-auto pr-1 flex flex-col gap-1.5 unique-scrollbar select-text">
        {ledger.length === 0 ? (
          <div className="py-4 text-center text-[9px] text-neutral-600 font-bold uppercase tracking-wider italic">
            No whale spikes cataloged in current runtime window
          </div>
        ) : (
          ledger.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between text-[10px] p-2 bg-neutral-950 border border-neutral-800/60 rounded-lg hover:border-neutral-700/80 transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-neutral-600 font-bold tracking-tighter tabular-nums group-hover:text-amber-500/80 transition-colors">
                  [{event.timestamp}]
                </span>
                <span className="font-black text-neutral-300">
                  {event.symbol}
                </span>
              </div>

              <div className="flex items-center gap-3 tabular-nums">
                <span className="font-bold text-neutral-400">
                  ${formatMarketPrice(event.price)}
                </span>
                <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-900/30 rounded">
                  {formatCompactVolume(event.volume)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WhaleLedgerLog;
