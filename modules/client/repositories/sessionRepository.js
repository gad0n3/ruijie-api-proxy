const { getSessionByAppId } = require("../../../infrastructure/sessionStore");

/**
 * @typedef {object} ClientSessionRepository
 * @property {(appid: string) => Promise<object | null>} getByAppId - Retrieves a session by application ID.
 */

/**
 * Creates a client session repository that delegates session retrieval to the main session store.
 * This repository acts as an adapter for client-related session needs.
 * @returns {ClientSessionRepository} An object implementing the ClientSessionRepository interface.
 */
function createClientSessionRepository() {
  return {
    /**
     * Retrieves a session from the underlying session store by application ID.
     * @param {string} appid - The application ID.
     * @returns {Promise<object | null>} The session data, or null if not found.
     */
    getByAppId(appid) {
      return getSessionByAppId(appid);
    },
  };
}

module.exports = {
  createClientSessionRepository,
};
