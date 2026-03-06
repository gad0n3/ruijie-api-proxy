const { upstreamRequest } = require('../../../helpers/upstreamHttp');

function createVoucherGateway() {
  return {
    listVouchers(token, { tenantName, groupId, start, pageSize, status, lang, accessToken }) {
      return upstreamRequest({
        method: 'GET',
        url: `/intlSamVoucher/getList/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          start,
          pageSize,
          status,
          lang,
          access_token: accessToken
        }
      });
    },

    getVoucherStatus(token, { tenantName, groupId, tenantId, accessToken }) {
      return upstreamRequest({
        method: 'GET',
        url: `/intlSamVoucher/getStatus/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          tenantId,
          lang: 'en',
          access_token: accessToken
        }
      });
    },

    generateVoucher(token, { tenantName, groupId, lang, accessToken, payload }) {
      return upstreamRequest({
        method: 'POST',
        url: `/intlSamVoucher/create/${encodeURIComponent(tenantName)}/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          group_id: groupId,
          lang: lang || 'en',
          access_token: accessToken
        },
        data: payload
      });
    },

    deleteVoucherBatch(token, { ids, groupId, lang, accessToken, list }) {
      return upstreamRequest({
        method: 'DELETE',
        url: '/intlSamVoucher/v2/delete',
        token,
        params: {
          ids,
          group_id: groupId,
          lang: lang || 'en',
          access_token: accessToken
        },
        data: list
      });
    }
  };
}

module.exports = {
  createVoucherGateway
};
