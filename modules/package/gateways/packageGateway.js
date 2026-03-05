const { upstreamRequest } = require('../../../helpers/upstreamHttp');

function createPackageGateway() {
  return {
    listPackages(token, { groupId, pageIndex, pageSize, lang, accessToken }) {
      return upstreamRequest({
        method: 'GET',
        url: `/intl/usergroup/list/${groupId}`,
        token,
        params: {
          pageIndex,
          pageSize,
          lang,
          access_token: accessToken
        }
      });
    },

    createPackage(token, payload) {
      return upstreamRequest({
        method: 'POST',
        url: '/packages/create',
        token,
        data: payload
      });
    },

    createAuthProfile(token, { tenantName, groupId, tenantId, lang, payload, accessToken }) {
      return upstreamRequest({
        method: 'POST',
        url: `/intlSamProfile/create/${encodeURIComponent(tenantName)}/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          tenantId,
          lang: lang || 'en',
          access_token: accessToken
        },
        data: payload
      });
    },

    createUserGroup(token, { groupId, lang, item, accessToken }) {
      return upstreamRequest({
        method: 'POST',
        url: `/intl/usergroup/group/${groupId}`,
        token,
        params: {
          lang: lang || 'en',
          access_token: accessToken
        },
        data: {
          list: [item]
        }
      });
    },

    updateAuthProfile(token, { tenantName, groupId, tenantId, lang, payload, accessToken }) {
      return upstreamRequest({
        method: 'POST',
        url: `/intlSamProfile/update/${encodeURIComponent(tenantName)}/${encodeURIComponent(tenantName)}/${groupId}`,
        token,
        params: {
          tenantId,
          group_id: groupId,
          lang: lang || 'en',
          access_token: accessToken
        },
        data: payload
      });
    },

    updateUserGroup(token, { groupId, lang, payload, accessToken }) {
      return upstreamRequest({
        method: 'PUT',
        url: `/intl/usergroup/group/${groupId}`,
        token,
        params: {
          group_id: groupId,
          lang: lang || 'en',
          access_token: accessToken
        },
        data: payload
      });
    },

    updatePackageGroup(token, groupId, payload) {
      return upstreamRequest({
        method: 'POST',
        url: `/packages/${groupId}`,
        token,
        data: payload
      });
    },

    deletePackage(token, uuid) {
      return upstreamRequest({
        method: 'DELETE',
        url: `/packages/${uuid}`,
        token
      });
    },

    deleteUserGroup(token, { groupId, packageId, lang, accessToken }) {
      return upstreamRequest({
        method: 'DELETE',
        url: `/intl/usergroup/group/${groupId}`,
        token,
        params: {
          lang: lang || 'en',
          access_token: accessToken
        },
        data: {
          list: [packageId]
        }
      });
    },

    deleteAuthProfile(token, { authProfileId, tenantId, groupId, lang, accessToken }) {
      return upstreamRequest({
        method: 'DELETE',
        url: `/intlSamProfile/delete/${encodeURIComponent(authProfileId)}`,
        token,
        params: {
          tenantId,
          group_id: groupId,
          lang: lang || 'en',
          access_token: accessToken
        }
      });
    }
  };
}

module.exports = {
  createPackageGateway
};
