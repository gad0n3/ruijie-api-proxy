const { upstreamRequest } = require("../../../helpers/upstreamHttp");
const { UpstreamError } = require("../../../helpers/AppError");

/**
 * @typedef {object} VoucherGateway
 * @property {(token: string, options: { tenantName: string; groupId: string; start: number; pageSize: number; status: number; lang?: string; accessToken: string }) => Promise<object>} listVouchers - Lists vouchers from the upstream API.
 * @property {(token: string, options: { tenantName: string; groupId: string; tenantId: string; accessToken: string }) => Promise<object>} getVoucherStatus - Gets the status of vouchers from the upstream API.
 * @property {(token: string, options: { tenantName: string; groupId: string; lang?: string; accessToken: string; payload: object }) => Promise<object>} generateVoucher - Generates new vouchers via the upstream API.
 * @property {(token: string, options: { ids: string; groupId: string; lang?: string; accessToken: string; list: object }) => Promise<object>} deleteVoucherBatch - Deletes a batch of vouchers from the upstream API.
 */

/**
 * Creates a voucher gateway for interacting with the Ruijie upstream voucher API.
 * @returns {VoucherGateway} An object implementing the VoucherGateway interface.
 */
function createVoucherGateway() {
  return {
    /**
     * Lists vouchers from the upstream API based on provided criteria.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for listing vouchers.
     * @param {string} options.tenantName - The name of the tenant.
     * @param {string} options.groupId - The ID of the group.
     * @param {number} options.start - The starting index for pagination.
     * @param {number} options.pageSize - The number of items per page.
     * @param {number} options.status - The status of the vouchers to list (e.g., 1 for unused).
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {string} options.accessToken - The access token for the upstream API.
     * @returns {Promise<object>} The upstream response containing the list of vouchers.
     */
    listVouchers(
      token,
      { tenantName, groupId, start, pageSize, status, lang, accessToken },
    ) {
      return upstreamRequest({
        method: "GET",
        url: `/intlSamVoucher/getList/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          start,
          pageSize,
          status,
          lang,
          access_token: accessToken,
        },
      });
    },

    /**
     * Retrieves the status summary of vouchers from the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for getting voucher status.
     * @param {string} options.tenantName - The name of the tenant.
     * @param {string} options.groupId - The ID of the group.
     * @param {string} options.tenantId - The ID of the tenant.
     * @param {string} options.accessToken - The access token for the upstream API.
     * @returns {Promise<object>} The upstream response containing the voucher status.
     */
    getVoucherStatus(token, { tenantName, groupId, tenantId, accessToken }) {
      return upstreamRequest({
        method: "GET",
        url: `/intlSamVoucher/getStatus/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          tenantId,
          lang: "en",
          access_token: accessToken,
        },
      });
    },

    /**
     * Generates new vouchers via the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for generating vouchers.
     * @param {string} options.tenantName - The name of the tenant.
     * @param {string} options.groupId - The ID of the group.
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {string} options.accessToken - The access token for the upstream API.
     * @param {object} options.payload - The payload containing voucher generation details.
     * @returns {Promise<object>} The upstream response after generating vouchers.
     */
    generateVoucher(
      token,
      { tenantName, groupId, lang, accessToken, payload },
    ) {
      return upstreamRequest({
        method: "POST",
        url: `/intlSamVoucher/create/${encodeURIComponent(tenantName)}/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          group_id: groupId,
          lang: lang || "en",
          access_token: accessToken,
        },
        data: payload,
      });
    },

    /**
     * Deletes a batch of vouchers from the upstream API.
     * @param {string} token - The bearer token for authentication.
     * @param {object} options - Options for deleting vouchers.
     * @param {string} options.ids - Comma-separated list of voucher IDs to delete.
     * @param {string} options.groupId - The ID of the group the vouchers belong to.
     * @param {string} [options.lang='en'] - The language for the response.
     * @param {string} options.accessToken - The access token for the upstream API.
     * @param {object} options.list - The list of vouchers to delete (often in the request body for DELETE).
     * @returns {Promise<object>} The upstream response after deleting the vouchers.
     */
    deleteVoucherBatch(token, { ids, groupId, lang, accessToken, list }) {
      return upstreamRequest({
        method: "DELETE",
        url: "/intlSamVoucher/v2/delete",
        token,
        params: {
          ids,
          group_id: groupId,
          lang: lang || "en",
          access_token: accessToken,
        },
        data: list,
      });
    },
  };
}

module.exports = {
  createVoucherGateway,
};
