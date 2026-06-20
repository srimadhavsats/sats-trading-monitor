import React, { useState, useEffect } from "react";
// Ingest the live full-duplex connection channel context hook
import { useTelemetry } from "../context/TelemetryContext";
import { CONFIG } from "../config";

const NetworkDiagnostics = () => {
  // Pull the current socket pipeline state directly from the global stream context
  const { connected: wsConnected } = useTelemetry();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const baseUrl =
          CONFIG.BACKEND_URL ||
          CONFIG.BACKEND_WS_URL.replace("ws://", "http://").replace("/ws", "");
        const response = await fetch(`${baseUrl}/health/diagnostics`);
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error("❌ Failed to pull cross-layer diagnostics:", err);
        setMetrics({
          status: "Offline",
          latency_ms: 0,
          connected: false,
          seconds_since_last_tick: -1.0,
          cache_synchronized: false,
          error: "Gateway Unreachable",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
    const pollInterval = setInterval(fetchDiagnostics, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  if (loading) {
    return (
      <div className="p-4 border border-neutral-800 rounded-xl bg-neutral-900/40 w-96 animate-pulse h-20 flex items-center justify-between">
        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600 font-mono">
          Mapping Circuit Heartbeats...
        </span>
      </div>
    );
  }

  const isHealthy = metrics?.status === "Healthy" && wsConnected;
  const isDegraded =
    metrics?.status === "Degraded" ||
    (!metrics?.cache_synchronized && metrics?.seconds_since_last_tick > 0);

  const statusColor = isHealthy
    ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/40"
    : isDegraded
      ? "text-amber-400 bg-amber-950/40 border-amber-800/40"
      : "text-rose-400 bg-rose-950/40 border-rose-800/40";

  return (
    <div className="p-5 border rounded-2xl bg-neutral-900/95 backdrop-blur-2xl w-96 border-neutral-800 flex flex-col gap-3 font-mono">
      {/* Upper Segment: Node Header and Master Status Badge */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest">
            Infrastructure Core ({metrics?.upstream_gateway || "Oracle Gateway"}
            )
          </span>
          <span className="text-[11px] font-bold text-neutral-300">
            Cross-Layer Circuit Observability
          </span>
        </div>
        <div
          className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${statusColor}`}
        >
          {isHealthy ? "Nominal" : isDegraded ? "Degraded" : "Fault"}
        </div>
      </div>

      {/* Lower Segment: Split Status Matrix Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
        {/* Metric 1: HTTP API Gateway Round Trip Latency */}
        <div className="p-2 border border-neutral-800 bg-neutral-950 rounded-xl flex flex-col gap-0.5">
          <span className="text-[6px] font-black text-neutral-600 uppercase tracking-wider">
            API RTT
          </span>
          <span className="font-bold text-neutral-300">
            {metrics?.latency_ms > 0 ? `${metrics.latency_ms}ms` : "---"}
          </span>
        </div>

        {/* Metric 2: Full-Duplex Local Socket Status */}
        <div className="p-2 border border-neutral-800 bg-neutral-950 rounded-xl flex flex-col gap-0.5">
          <span className="text-[6px] font-black text-neutral-600 uppercase tracking-wider">
            WS Socket
          </span>
          <span
            className={`font-bold ${wsConnected ? "text-emerald-400" : "text-rose-400"}`}
          >
            {wsConnected ? "Active" : "Closed"}
          </span>
        </div>

        {/* Metric 3: Background Worker Thread Cache Delta */}
        <div className="p-2 border border-neutral-800 bg-neutral-950 rounded-xl flex flex-col gap-0.5">
          <span className="text-[6px] font-black text-neutral-600 uppercase tracking-wider">
            Cache Delta
          </span>
          <span
            className={`font-bold ${metrics?.cache_synchronized ? "text-emerald-400" : "text-amber-400"}`}
          >
            {metrics?.seconds_since_last_tick >= 0
              ? `${metrics.seconds_since_last_tick}s`
              : "No Tick"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NetworkDiagnostics;
