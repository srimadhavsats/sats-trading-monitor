import { useTelemetry } from "../context/useTelemetry";
import { CONFIG } from "../config";

const SymbolSelector = () => {
  const { symbol, setSymbol } = useTelemetry();

  return (
    <div className="w-full p-5 rounded-2xl terminal-card font-mono flex flex-col gap-3 select-none">
      <div className="flex items-center justify-between border-b border-[#1a2333] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🎛️</span>
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
            Telemetry Room Multiplexer
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase">
          Live Vector Switch
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CONFIG.SUPPORTED_PAIRS.map((pair) => {
          const isActive = symbol === pair.id;
          return (
            <button
              key={pair.id}
              onClick={() => {
                if (!isActive) {
                  setSymbol(pair.id);
                }
              }}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all outline-none cursor-pointer ${
                isActive
                  ? "bg-slate-800/90 border-emerald-500/70 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-[#090d16] border-[#1a2333] text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold tabular-nums">
                  {pair.symbol}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold uppercase">
                  {pair.network}
                </span>
              </div>

              {isActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SymbolSelector;
