import { useTelemetry } from "../context/useTelemetry";

const StatusBar = () => {
  const { symbol, status } = useTelemetry();

  return (
    <footer className="w-full border-t border-[#1a2333] bg-[#090d16]/90 backdrop-blur-xl px-4 lg:px-8 py-2.5 text-[11px] font-mono text-slate-500 select-none">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ENGINE: SATS SENTINEL v4.2
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden md:inline">SECURITY: CSWSH Regex Guard Active</span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden md:inline">ORACLE: Bybit v5 Spot High-Frequency API</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            ACTIVE ROOM: <strong className="text-slate-200">{symbol}</strong>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">
            STATUS: <strong className={status === "connected" ? "text-emerald-400" : "text-amber-400"}>{status.toUpperCase()}</strong>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
