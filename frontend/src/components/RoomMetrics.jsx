import React, { useState, useEffect } from "react";
import { CONFIG } from "../config";

const RoomMetrics = () => {
  const [roomData, setRoomData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomMetrics = async () => {
      try {
        const baseUrl =
          CONFIG.BACKEND_URL ||
          CONFIG.BACKEND_WS_URL.replace("ws://", "http://").replace("/ws", "");
        const response = await fetch(`${baseUrl}/metrics/rooms/all`);
        if (!response.ok) throw new Error("Network metrics channel degraded");

        const data = await response.json();
        setRoomData(data);
      } catch (err) {
        console.error("── 📊 ROOM MATRIX TRACKING ANOMALY ──", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomMetrics();
    const pollInterval = setInterval(fetchRoomMetrics, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const activeRoomKeys = Object.keys(roomData);

  if (loading) {
    return (
      <div className="w-96 p-4 border border-neutral-800 rounded-xl bg-neutral-900/40 animate-pulse h-20 flex items-center justify-center">
        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600 font-mono">
          Aggregating Channel Matrices...
        </span>
      </div>
    );
  }

  return (
    <div className="w-96 p-5 border rounded-2xl bg-neutral-900/95 backdrop-blur-2xl border-neutral-800 font-mono flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 border-b border-neutral-800/60 pb-2">
        <h4 className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">
          Isolated Stream Concurrency
        </h4>
        <p className="text-[7px] text-neutral-600 uppercase font-bold tracking-wider">
          Active network partitions mapped across the cluster memory space
        </p>
      </div>

      {activeRoomKeys.length === 0 ? (
        <div className="py-2 text-center text-[9px] text-neutral-600 font-bold uppercase tracking-wider">
          No active client sockets allocated to rooms
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {activeRoomKeys.map((room) => {
            const count = roomData[room];
            return (
              <div
                key={room}
                className="p-3 border border-neutral-800/80 rounded-xl bg-neutral-950 flex flex-col gap-1 transition-all hover:border-neutral-700"
              >
                <span className="text-[8px] font-black text-neutral-500 tracking-wider">
                  {room.replace("-", "/")}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-neutral-200 tracking-tighter tabular-nums">
                    {count}
                  </span>
                  <span className="text-[7px] font-black text-neutral-600 uppercase tracking-widest">
                    {count === 1 ? "Subscriber" : "Subscribers"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomMetrics;
