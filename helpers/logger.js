/**
 * @typedef {object} Logger
 * @property {(message: string, ...args: any[]) => void} debug - Logs a debug message.
 * @property {(message: string, ...args: any[]) => void} info - Logs an informational message.
 * @property {(message: string, ...args: any[]) => void} warn - Logs a warning message.
 * @property {(message: string, ...args: any[]) => void} error - Logs an error message.
 */

/**
 * Creates a simple logger abstraction that defaults to console logging.
 * This can be easily replaced with a more sophisticated logger (e.g., Winston, Pino) later.
 * @returns {Logger}
 */
function createLogger() {
  return {
    debug(message, ...args) {
      console.debug(message, ...args);
    },
    info(message, ...args) {
      console.info(message, ...args);
    },
    warn(message, ...args) {
      console.warn(message, ...args);
    },
    error(message, ...args) {
      console.error(message, ...args);
    },
  };
}

// Export a singleton instance of the logger for simplicity in this project structure.
module.exports = createLogger();
