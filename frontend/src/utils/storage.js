/**
 * SATS Sentinel v4.1 - Client Storage Abstraction Layer
 * Provides fault-tolerant persistence mechanisms for client dashboard preferences.
 */

const STORAGE_PREFIX = "sats_sentinel_";

export const storage = {
  /**
   * Safely retrieves and parses a value from localStorage.
   * @param {string} key - The look-up identifier suffix.
   * @param {*} defaultValue - Fallback value if the key does not exist or fails to parse.
   * @returns {*} The parsed item or default value.
   */
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`[Storage Engine] Error reading key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safely serializes and saves a value to localStorage.
   * @param {string} key - The storage target identifier suffix.
   * @param {*} value - The data structure to persist.
   */
  set: (key, value) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage Engine] Error writing key "${key}":`, error);
    }
  },

  /**
   * Safely removes a persistent key from active browser memory.
   * @param {string} key - The targeting identifier suffix.
   */
  remove: (key) => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.error(`[Storage Engine] Error removing key "${key}":`, error);
    }
  },
};
