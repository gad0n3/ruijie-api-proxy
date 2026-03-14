const { upstreamRequest } = require("../../../helpers/upstreamHttp");

/**
 * @typedef {object} NetworkGroupGateway
 * @property {(token: string, accessToken: string) => Promise<object>} getGroupTree - Retrieves the network group tree from the upstream API.
 */

/**
 * Creates a network group gateway for interacting with the Ruijie upstream network group API.
 * @returns {NetworkGroupGateway} An object implementing the NetworkGroupGateway interface.
 */
function createNetworkGroupGateway() {
  return {
    /**
     * Retrieves the network group tree from the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {string} accessToken - The access token for the upstream API.
     * @returns {Promise<object>} The upstream response containing the network group tree.
     */
    getGroupTree(token, accessToken) {
      return upstreamRequest({
        method: "GET",
        url: "/group/single/tree",
        token,
        params: {
          access_token: accessToken,
        },
      });
    },
  };
}

module.exports = {
  createNetworkGroupGateway,
};
