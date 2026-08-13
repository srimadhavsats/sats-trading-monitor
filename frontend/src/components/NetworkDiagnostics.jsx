import { useState, useEffect } from "react";
import { useTelemetry } from "../context/useTelemetry";
import { CONFIG } from "../config";

const NetworkDiagnostics = () => {
  const { connected: wsConnected } = useTelemetry();
  const [metrics, setMetrics] = useState(null);
  const [systemTelemetry, setSystemTelemetry] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAllDiagnostics = async () => {
      try {
        const baseUrl = CONFIG.BACKEND_URL.endsWith("/")
          ? CONFIG.BACKEND_URL.slice(0, -1)
          : CONFIG.BACKEND_URL;

        const [diagRes, sysRes] = await Promise.all([
          fetch(`${baseUrl}/health/diagnostics`),
          fetch(`${baseUrl}/metrics/system`),
        ]);

        if (diagRes.ok) {
          const diagData = await diagRes.json();
          if (isMounted) setMetrics(diagData);
        }

        if (sysRes.ok) {
          const sysData = await sysRes.json();
          if (isMounted) setSystemTelemetry(sysData);
        }
      } catch {
        if (isMounted) {
          setMetrics({
            status: "Degraded",
            latency_ms: 0,
            connected: false,
            seconds_since_last_tick: -1.0,
            cache_synchronized: false,
            upstream_gateway: "Bybit API v5",
          });
        }
      }
    };

    fetchAllDiagnostics();
    const interval = setInterval(fetchAllDiagnostics, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isHealthy = metrics?.status === "Healthy" && wsConnected;
  const isDegraded = !isHealthy && (metrics?.connected || wsConnected);

  const statusBadge = isHealthy
    ? { text: "NOMINAL", color: "bg-emerald-950/60 text-emerald-400 border-emerald-800/50" }
    : isDegraded
    ? { text: "DEGRADED", color: "bg-amber-950/60 text-amber-400 border-amber-800/50" }
    : { text: "FAULT", color: "bg-rose-950/60 text-rose-400 border-rose-800/50" };

  const formatUptime = (seconds) => {
    if (!seconds) return "--";
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m ${Math.floor(seconds % 60)}s`;
  };

  return (
    <div className="w-full p-5 rounded-2xl terminal-card font-mono flex flex-col gap-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1a2333] pb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Infrastructure & Circuit Observability
          </span>
          <span className="text-xs font-black text-slate-200">
            {metrics?.upstream_gateway || "Bybit API v5 Oracle"}
          </span>
        </div>

        <div
          className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${statusBadge.color}`}
        >
          {statusBadge.text}
        </div>
      </div>

      {/* Observability Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Metric 1: Oracle Latency */}
        <div className="p-3 rounded-xl bg-[#090d16] border border-[#1a2333] flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            API RTT Latency
          </span>
          <span className="font-extrabold text-slate-200 tabular-nums">
            {metrics?.latency_ms > 0 ? `${metrics.latency_ms} ms` : "---"}
          </span>
        </div>

        {/* Metric 2: WebSocket State */}
        <div className="p-3 rounded-xl bg-[#090d16] border border-[#1a2333] flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Full-Duplex WS
          </span>
          <span
            className={`font-extrabold flex items-center gap-1.5 ${
              wsConnected ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wsConnected ? "bg-emerald-400" : "bg-rose-500"
              }`}
            />
            {wsConnected ? "Active" : "Closed"}
          </span>
        </div>

        {/* Metric 3: Cache Freshness */}
        <div className="p-3 rounded-xl bg-[#090d16] border border-[#1a2333] flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Tick Freshness
          </span>
          <span
            className={`font-extrabold tabular-nums ${
              metrics?.cache_synchronized ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {metrics?.seconds_since_last_tick >= 0
              ? `${metrics.seconds_since_last_tick}s ago`
              : "No Tick"}
          </span>
        </div>

        {/* Metric 4: System Uptime */}
        <div className="p-3 rounded-xl bg-[#090d16] border border-[#1a2333] flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Engine Uptime
          </span>
          <span className="font-extrabold text-slate-300 tabular-nums">
            {systemTelemetry ? formatUptime(systemTelemetry.uptime_seconds) : "--"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NetworkDiagnostics;
