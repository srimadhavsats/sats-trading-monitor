import { useTelemetry } from "../context/useTelemetry";

const ConnectionBanner = () => {
  const { status, symbol } = useTelemetry();

  if (status === "connected") return null;

  const isConnecting = status === "connecting";

  return (
    <div
      className={`w-full p-3.5 border font-mono text-xs flex items-center justify-between rounded-xl transition-all select-none ${
        isConnecting
          ? "bg-amber-950/40 text-amber-300 border-amber-800/60 animate-pulse"
          : "bg-rose-950/40 text-rose-300 border-rose-800/60"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isConnecting ? "bg-amber-400" : "bg-rose-500"
          }`}
        />
        <span className="font-bold">
          {isConnecting
            ? `Pipeline socket disconnected ── Synchronizing stream handshake for [${symbol}]...`
            : "Transport connection fault ── Server link timed out."}
        </span>
      </div>

      <div className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-[#090d16] border border-slate-700/80 rounded-lg">
        {isConnecting ? "Auto-Reconnecting" : "Offline"}
      </div>
    </div>
  );
};

export default ConnectionBanner;
