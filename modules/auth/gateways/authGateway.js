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

function getLoginAccessToken(loginResponse) {
  return loginResponse?.accessToken || loginResponse?.access_token || '';
}

function createAuthGateway() {
  return {
    async login(credentials) {
      const request = buildLoginRequest(credentials);

      try {
        const response = await upstreamRequest(request);
        const upstreamCode = Number(response?.code);

        if (upstreamCode !== 0) {
          console.error('[Uplink /oauth20/client/access_token] rejected', {
            appid: credentials?.appid || '',
            code: response?.code,
            msg: response?.msg,
            details: response
          });

          const error = new Error(response?.msg || 'Login failed');
          error.statusCode = 401;
          error.details = response;
          throw error;
        }

        const accessToken = getLoginAccessToken(response);

        console.log('[Uplink /oauth20/client/access_token] success', {
          appid: credentials?.appid || '',
          hasAccessToken: Boolean(accessToken),
          code: response?.code,
          msg: response?.msg
        });

        if (accessToken) {
          console.log('[Uplink /oauth20/client/access_token] access_token:', accessToken);
        }

        return response;
      } catch (error) {
        console.error('[Uplink /oauth20/client/access_token] failed', {
          appid: credentials?.appid || '',
          statusCode: error?.statusCode || 500,
          message: error?.message || 'Upstream login failed',
          details: error?.details || null
        });

        throw error;
      }
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
