/**
 * SATS Sentinel - Telemetry Formatting Utilities
 * Centralized data normalization and localization helper functions.
 */

/**
 * Formats a raw numeric asset price into a clean localized string with dynamic precision.
 * @param {number} price - The raw float value from the oracle feed.
 * @returns {string} Fully localized display value.
 */
export const formatMarketPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) return "0.00";
  
  if (price === 0) return "0.00";
  
  if (price < 0.001) {
    return price.toFixed(6);
  } else if (price < 1) {
    return price.toFixed(4);
  } else if (price < 10) {
    return price.toFixed(3);
  }
  
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formats a raw price change percentage into a human-readable ticker metric.
 * Automatically appends explicit positive symbols and rounds decimal boundaries.
 * @param {number} change - The raw percentage change value.
 * @returns {string} Formatted performance string (e.g., "+1.45%" or "-2.30%").
 */
export const formatPriceChange = (change) => {
  if (change === undefined || change === null || isNaN(change)) return "0.00%";
  const formatted = Math.abs(change).toFixed(2);
  return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
};

/**
 * Formats a date object or timestamp into an execution-style time string.
 * @param {Date|string|number} dateInput - Raw time variable.
 * @returns {string} Formatted localized time (e.g., "23:37:32").
 */
export const formatTimestamp = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Formats large financial figures (turnover/volume) into compact notation ($125.04M, $450.20K).
 * @param {number} volume - The raw volume float value from the stream oracle.
 * @returns {string} Compact formatted financial notation string.
 */
export const formatCompactVolume = (volume) => {
  if (!volume || isNaN(volume)) return "$0.00";
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "USD",
  }).format(volume);
};

/**
 * Formats raw mathematical volatility calculations into a precise percentage string.
 * @param {number} spread - The raw calculated spread percentage.
 * @returns {string} Clean formatted percentage string.
 */
export const formatSpread = (spread) => {
  if (spread === undefined || spread === null || isNaN(spread)) return "0.00%";
  return `${spread.toFixed(2)}%`;
};
