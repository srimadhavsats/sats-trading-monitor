import { useState, useEffect } from "react";
import { useTelemetry } from "../context/useTelemetry";
import { CONFIG } from "../config";
import { formatTimestamp } from "../utils/formatters";

const Header = () => {
  const { symbol, setSymbol, status, audioEnabled, setAudioEnabled } = useTelemetry();
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <header className="w-full border-b border-[#1a2333] bg-[#090d16]/90 backdrop-blur-xl px-4 lg:px-8 py-3 select-none sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Terminal Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-black text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider text-slate-100 uppercase font-mono">
                SATS Sentinel
              </h1>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40">
                v4.2 PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight">
              High-Frequency Market Telemetry & Liquidity Radar
            </p>
          </div>
        </div>

        {/* Room Navigation Tabs */}
        <div className="flex items-center bg-[#0d131f] border border-[#1b2438] p-1 rounded-xl gap-1">
          {CONFIG.SUPPORTED_PAIRS.map((pair) => {
            const isActive = symbol === pair.id;
            return (
              <button
                key={pair.id}
                onClick={() => setSymbol(pair.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <span>{pair.symbol}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                )}
              </button>
            );
          })}
        </div>

        {/* Controls & Connection Status */}
        <div className="flex items-center gap-3">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? "Whale Alert Audio Active" : "Whale Alert Audio Muted"}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              audioEnabled
                ? "bg-amber-950/30 text-amber-300 border-amber-900/40 hover:bg-amber-950/50"
                : "bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300"
            }`}
          >
            <span>{audioEnabled ? "🔔 Chime ON" : "🔕 Muted"}</span>
          </button>

          {/* Connection Status Badge */}
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-2 ${
              isConnected
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                : isConnecting
                ? "bg-amber-950/40 text-amber-400 border-amber-900/50"
                : "bg-rose-950/40 text-rose-400 border-rose-900/50"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-emerald-400 live-dot"
                  : isConnecting
                  ? "bg-amber-400 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span className="uppercase text-[11px] tracking-wider">
              {isConnected ? "LIVE STREAM" : isConnecting ? "CONNECTING" : "OFFLINE"}
            </span>
          </div>

          {/* System UTC Time */}
          <div className="hidden xl:flex items-center text-xs font-mono text-slate-400 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg tabular-nums">
            🕒 {formatTimestamp(currentTime)} UTC
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
