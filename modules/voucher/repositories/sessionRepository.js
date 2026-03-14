const { getSessionByAppId } = require("../../../infrastructure/sessionStore");

/**
 * @typedef {object} VoucherSessionRepository
 * @property {(appid: string) => Promise<object | null>} getByAppId - Retrieves a voucher session by application ID.
 */

/**
 * Creates a session repository specifically for the voucher module.
 * It delegates session retrieval to the general session store.
 * @returns {VoucherSessionRepository} An object implementing the VoucherSessionRepository interface.
 */
function createVoucherSessionRepository() {
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
  createVoucherSessionRepository,
};
