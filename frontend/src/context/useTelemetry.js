import { useContext } from "react";
import { TelemetryContext } from "./context";

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  }
  return context;
};

export default useTelemetry;
