import React from "react";
import { useTelemetry } from "../context/TelemetryContext";

const PriceCard = () => {
  const { data, status } = useTelemetry();

  // Guard Clause: Handle initial buffering states when data hasn't hit the wire yet
  if (!data) {
    return (
      <div className="w-96 p-6 border border-neutral-800 bg-neutral-950 font-mono rounded-2xl flex flex-col items-center justify-center gap-2 select-none">
        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">
          Synchronizing Ingestion Stream...
        </span>
      </div>
    );
  }

  // Safe Extraction using defensive fallback metrics
  const symbol = data.symbol || "UNKNOWN/PAIR";
  const price = typeof data.price === "number" ? data.price : 0;
  const change = typeof data.change === "number" ? data.change : 0;
  const volume = typeof data.volume === "number" ? data.volume : 0;

  const isBullish = change >= 0;

  return (
    <div className="w-96 p-5 border border-neutral-800 bg-neutral-900/50 backdrop-blur-xl font-mono rounded-2xl flex flex-col gap-3 select-none">
      {/* Top Meta Row */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
        <span className="text-[11px] font-black text-neutral-200 uppercase tracking-wider">
          {symbol}
        </span>
        <span
          className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
            status === "connected"
              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
              : "bg-neutral-950 text-neutral-500"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Main Core Price Display */}
      <div className="flex flex-col gap-0.5">
        <div className="text-2xl font-black text-neutral-100 tracking-tight tabular-nums">
          $
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}
        </div>
        <div
          className={`text-[9px] font-bold uppercase tracking-wider ${isBullish ? "text-emerald-400" : "text-rose-400"}`}
        >
          {isBullish ? "▲" : "▼"} {change.toFixed(2)}%{" "}
          <span className="text-neutral-600 font-medium">/ 24h</span>
        </div>
      </div>

      {/* Underbelly Meta Grid */}
      <div className="grid grid-cols-2 gap-2 border-t border-neutral-800/40 pt-2 text-[9px]">
        <div className="flex flex-col">
          <span className="text-[7px] text-neutral-500 font-black uppercase tracking-wider">
            Rolling Turnover
          </span>
          <span className="font-bold text-neutral-300 tabular-nums">
            ${volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[7px] text-neutral-500 font-black uppercase tracking-wider">
            Engine Vector
          </span>
          <span className="font-bold text-neutral-400 uppercase tracking-widest">
            Oracle Node
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceCard;
