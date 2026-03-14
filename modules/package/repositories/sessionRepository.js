const { getSessionByAppId } = require("../../../infrastructure/sessionStore");

/**
 * @typedef {object} PackageSessionRepository
 * @property {(appid: string) => Promise<object | null>} getByAppId - Retrieves a package session by application ID.
 */

/**
 * Creates a session repository specifically for the package module.
 * It delegates session retrieval to the general session store.
 * @returns {PackageSessionRepository} An object implementing the PackageSessionRepository interface.
 */
function createPackageSessionRepository() {
  return {
    /**
     * Retrieves a session from the store by application ID.
     * @param {string} appid - The application ID.
     * @returns {Promise<object | null>} The session data, or null if not found.
     */
    getByAppId(appid) {
      return getSessionByAppId(appid);
    },
  };
}

module.exports = {
  createPackageSessionRepository,
};
