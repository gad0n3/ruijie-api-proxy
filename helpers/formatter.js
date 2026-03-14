/**
 * Shared formatting utilities for data transformation across modules.
 */

/**
 * Formats a network speed value (in Kbps) to a human-readable string.
 * @param {number|string} rateLimit - The rate limit in Kbps.
 * @returns {string} Formatted speed (e.g., "10Mbps", "1.5Gbps", "Unlimited").
 */
function formatSpeed(rateLimit) {
  const value = Number(rateLimit) || 0;

  if (value <= 0) {
    return "Unlimited";
  }

  const mbps = value / 1024;

  if (mbps >= 1000) {
    const gbps = mbps / 1024;
    return `${Number.isInteger(gbps) ? gbps : gbps.toFixed(2)}Gbps`;
  }

  return `${Number.isInteger(mbps) ? mbps : mbps.toFixed(2)}Mbps`;
}

/**
 * Formats a duration in minutes to a human-readable string.
 * @param {number|string} timePeriod - Duration in minutes.
 * @returns {string} Formatted duration (e.g., "2 hours", "1 day", "30 min").
 */
function formatDuration(timePeriod) {
  const minutes = Number(timePeriod) || 0;

  if (minutes <= 0) {
    return "Unlimited";
  }

  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days > 1 ? "s" : ""}`;
  }

  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  return `${minutes} min`;
}

/**
 * Formats a duration in seconds to a HH:mm format.
 * @param {number|string} activeSec - Duration in seconds.
 * @returns {string} Formatted time (e.g., "02:30").
 */
function formatActiveDuration(activeSec) {
  const totalSeconds = Number(activeSec) || 0;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Formats a timestamp into a standard date-time string.
 * @param {number|string|Date} timestamp - The timestamp to format.
 * @returns {string} Formatted date-time (YYYY-MM-DD HH:mm:ss).
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a timestamp into a MM/DD/YYYY date string.
 * @param {number|string|Date} timestamp - The timestamp to format.
 * @returns {string} Formatted date (MM/DD/YYYY).
 */
function formatDateOnly(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

/**
 * Formats a raw MAC address string into standard colon-separated format.
 * @param {string} raw - The raw MAC address string.
 * @returns {string} Formatted MAC address (e.g., "AA:BB:CC:DD:EE:FF").
 */
function formatMac(raw) {
  const hex = String(raw || "").replace(/[^a-fA-F0-9]/g, "");
  if (hex.length !== 12) {
    return String(raw || "").toUpperCase();
  }
  return hex.match(/.{2}/g).join(":").toUpperCase();
}

/**
 * Formats a timestamp into short date/time format: M/D/YYYY h:mm AM/PM
 * @param {number|string|Date} timestamp - The timestamp to format.
 * @returns {string} Formatted short date/time (e.g., "3/14/2026 3:30 PM").
 */
function formatShortDateTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

module.exports = {
  formatSpeed,
  formatDuration,
  formatActiveDuration,
  formatTimestamp,
  formatDateOnly,
  formatShortDateTime,
  formatMac,
};
