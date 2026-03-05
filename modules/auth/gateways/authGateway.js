const { upstreamRequest } = require('../../../helpers/upstreamHttp');
const config = require('../../../config');

function buildLoginRequest(credentials) {
  return {
    method: 'POST',
    url: '/oauth20/client/access_token',
    params: {
      token: config.ruijieLoginToken
    },
    data: {
      appid: credentials.appid,
      secret: credentials.secret
    },
    headers: {
      appid: credentials.appid,
      secret: credentials.secret
    }
  };
}

function createAuthGateway() {
  return {
    login(credentials) {
      return upstreamRequest(buildLoginRequest(credentials));
    },
    getTenantInfo(accessToken) {
      return upstreamRequest({
        method: 'GET',
        url: '/org/tenant/info',
        token: accessToken,
        params: {
          access_token: accessToken
        }
      });
    },
    getProjects(token) {
      return upstreamRequest({
        method: 'GET',
        url: '/auth/core/projects',
        token
      });
    },
    getTenant(token) {
      return upstreamRequest({
        method: 'GET',
        url: '/auth/core/tenant',
        token
      });
    }
  };
}

module.exports = {
  createAuthGateway
};
