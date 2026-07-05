import React from "react";
import { useTelemetry } from "../context/TelemetryContext";

const SymbolSelector = () => {
  const { symbol, setSymbol, status } = useTelemetry();

  const assetPairs = [
    { id: "BTC-USDT", label: "BTC / USDT", network: "Bitcoin Core" },
    { id: "ETH-USDT", label: "ETH / USDT", network: "Ethereum EVM" },
    { id: "SOL-USDT", label: "SOL / USDT", network: "Solana SV" },
  ];

  return (
    <div className="w-96 p-4 border rounded-2xl bg-neutral-900/95 border-neutral-800 font-mono flex flex-col gap-3 select-none">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
          Telemetry Room Switcher
        </h4>
        <p className="text-[7px] text-neutral-600 uppercase font-bold tracking-wider">
          Multiplex active websocket pipelines across distributed network states
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {assetPairs.map((pair) => {
          const isActive = symbol === pair.id;
          return (
            <button
              key={pair.id}
              onClick={() => {
                if (!isActive && status === "connected") {
                  setSymbol(pair.id);
                }
              }}
              disabled={status === "connecting"}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all outline-none ${
                isActive
                  ? "bg-neutral-950 border-emerald-500/80 text-neutral-100 font-black shadow-[0_0_12px_rgba(16,185,129,0.05)]"
                  : "bg-neutral-950/40 border-neutral-800/60 text-neutral-500 hover:text-neutral-400 hover:border-neutral-700/80 cursor-pointer disabled:cursor-not-allowed"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] tracking-wide tabular-nums">
                  {pair.label}
                </span>
                <span className="text-[6px] text-neutral-600 font-bold uppercase tracking-widest">
                  {pair.network}
                </span>
              </div>

              {isActive && (
                <div className="flex items-center gap-1.5 text-[7px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/40 px-2 py-0.5 border border-emerald-900/40 rounded-md animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  Live Stream
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SymbolSelector;
