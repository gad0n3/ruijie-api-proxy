const { upstreamRequest } = require("../../../helpers/upstreamHttp");

/**
 * @typedef {object} ClientGateway
 * @property {(token: string, query: { accessToken: string; groupId: string; pageIndex: number; pageSize: number }) => Promise<object>} getCurrentUserList - Fetches the current user list from the upstream API.
 */

/**
 * Creates a client gateway for interacting with Ruijie upstream client-related APIs.
 * @returns {ClientGateway} An object implementing the ClientGateway interface.
 */
function createClientGateway() {
  return {
    /**
     * Fetches the current user list from the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} query - Query parameters for fetching the user list.
     * @param {string} query.accessToken - The access token.
     * @param {string} query.groupId - The group ID.
     * @param {number} query.pageIndex - The page index for pagination.
     * @param {number} query.pageSize - The number of items per page.
     * @returns {Promise<object>} The upstream response containing the current user list.
     */
    getCurrentUserList(token, { accessToken, groupId, pageIndex, pageSize }) {
      return upstreamRequest({
        method: "GET",
        url: "/open/v1/dev/user/current-user",
        token,
        params: {
          access_token: accessToken,
          group_id: groupId,
          page_index: pageIndex,
          page_size: pageSize,
        },
      });
    },
  };
}

module.exports = {
  createClientGateway,
};
