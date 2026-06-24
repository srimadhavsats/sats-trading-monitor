import React from "react";
import { useTelemetry } from "../context/TelemetryContext";

const ConnectionBanner = () => {
  const { status } = useTelemetry();

  // Keep the workspace totally clean when the socket pipeline is operating nominally
  if (status === "connected") return null;

  const isConnecting = status === "connecting";

  return (
    <div
      className={`w-full max-w-4xl p-3 border font-mono text-[10px] flex items-center justify-between rounded-xl mb-4 transition-all animate-pulse select-none ${
        isConnecting
          ? "bg-amber-950/40 text-amber-400 border-amber-900/40"
          : "bg-rose-950/40 text-rose-400 border-rose-900/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${isConnecting ? "bg-amber-500" : "bg-rose-500"}`}
        />
        <span className="font-bold uppercase tracking-wider">
          {isConnecting
            ? "Network Circuit Interrupted ── Attempting Automated Recovery Pipeline"
            : "Data Link Terminated ── Critical Handshake Failure Fault"}
        </span>
      </div>

      <div className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-950 border border-neutral-800/80 rounded-md">
        {isConnecting ? "Retrying" : "Fault"}
      </div>
    </div>
  );
};

export default ConnectionBanner;
