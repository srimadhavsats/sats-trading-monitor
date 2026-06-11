import React, { useState, useEffect } from "react";
import { CONFIG } from "../config";
import { THEME } from "../theme";

const NetworkDiagnostics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        // Fallback calculation if explicit backend HTTP base string isn't initialized
        const baseUrl =
          CONFIG.BACKEND_URL ||
          CONFIG.BACKEND_WS_URL.replace("ws://", "http://").replace("/ws", "");
        const response = await fetch(`${baseUrl}/health/diagnostics`);
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error("❌ Failed to pull out-of-band diagnostics:", err);
        setMetrics({
          status: "Offline",
          latency_ms: 0,
          connected: false,
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
      <div className="p-4 border border-neutral-800 rounded-xl bg-neutral-900/40 w-96 animate-pulse h-14 flex items-center justify-between">
        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600">
          Analyzing RTT Circuits...
        </span>
      </div>
    );
  }

  const isHealthy = metrics?.status === "Healthy";
  const isDegraded = metrics?.status === "Degraded";

  const statusColor = isHealthy
    ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/40"
    : isDegraded
      ? "text-amber-400 bg-amber-950/40 border-amber-800/40"
      : "text-rose-400 bg-rose-950/40 border-rose-800/40";

  return (
    <div className="p-4 border rounded-xl bg-neutral-900/95 backdrop-blur-2xl w-96 border-neutral-800 flex items-center justify-between font-mono">
      <div className="flex flex-col gap-0.5">
        <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest">
          Upstream Node ({metrics?.upstream_gateway || "Oracle Gateway"})
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-300">
            {metrics?.connected ? "Pipeline Synchronized" : "Circuit Severed"}
          </span>
          {metrics?.latency_ms > 0 && (
            <span className="text-[10px] font-bold text-neutral-500">
              {metrics.latency_ms}ms
            </span>
          )}
        </div>
      </div>

      <div
        className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${statusColor}`}
      >
        {metrics?.status || "Unknown"}
      </div>
    </div>
  );
};

export default NetworkDiagnostics;
