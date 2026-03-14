const {
  verifyVipCredential,
} = require("../../../infrastructure/vipCredentialStore");

/**
 * @typedef {object} VipCredentialRepository
 * @property {(username: string, password: string) => Promise<{ appid: string; secret: string } | null>} verify - Verifies VIP credentials and returns mapped appid/secret.
 */

/**
 * Creates a VIP credential repository for verifying VIP user credentials.
 * @returns {VipCredentialRepository} An object implementing the VipCredentialRepository interface.
 */
function createVipCredentialRepository() {
  return {
    /**
     * Verifies a given username and password against stored VIP credentials.
     * @param {string} username - The VIP username.
     * @param {string} password - The VIP password.
     * @returns {Promise<{ appid: string; secret: string } | null>} A promise that resolves to an object containing appid and secret if credentials are valid, otherwise null.
     */
    verify(username, password) {
      return verifyVipCredential(username, password);
    },
  };
}

module.exports = {
  createVipCredentialRepository,
};
