import { useState, useEffect } from "react";
import { CONFIG } from "../config";
import { useTelemetry } from "../context/useTelemetry";

const RoomMetrics = () => {
  const { symbol: activeSymbol, setSymbol } = useTelemetry();
  const [roomData, setRoomData] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchRoomMetrics = async () => {
      try {
        const baseUrl = CONFIG.BACKEND_URL.endsWith("/")
          ? CONFIG.BACKEND_URL.slice(0, -1)
          : CONFIG.BACKEND_URL;

        const response = await fetch(`${baseUrl}/metrics/rooms/all`);
        if (!response.ok) throw new Error("Room metrics degraded");

        const data = await response.json();
        if (isMounted) setRoomData(data);
      } catch (err) {
        console.error("[Room Metrics] Fetch error:", err);
      }
    };

    fetchRoomMetrics();
    const pollInterval = setInterval(fetchRoomMetrics, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  const totalSubscribers = Object.values(roomData).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full p-5 rounded-2xl terminal-card font-mono flex flex-col gap-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1a2333] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">👥</span>
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
            Stream Concurrency & Partitioning
          </h3>
        </div>
        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
          {totalSubscribers} Total {totalSubscribers === 1 ? "Client" : "Clients"}
        </span>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CONFIG.SUPPORTED_PAIRS.map((pair) => {
          const count = roomData[pair.id] || 0;
          const isActive = activeSymbol === pair.id;

          return (
            <div
              key={pair.id}
              onClick={() => setSymbol(pair.id)}
              className={`p-3 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-800/90 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                  : "bg-[#090d16] border-[#1a2333] hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">
                  {pair.symbol}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 live-dot" />
                )}
              </div>

              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-slate-100 tabular-nums">
                  {count}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold uppercase">
                  {count === 1 ? "node" : "nodes"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomMetrics;
