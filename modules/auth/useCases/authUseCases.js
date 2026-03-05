function getAccessToken(loginResponse) {
  return (
    loginResponse?.accessToken ||
    loginResponse?.access_token ||
    ''
  );
}

function normalizeLoginPayload(payload) {
  return {
    appid: payload?.appid || payload?.ruijie_id,
    secret: payload?.secret || payload?.ruijie_secret
  };
}

function validateLoginCredentials(credentials) {
  if (!credentials.appid || !credentials.secret) {
    const error = new Error('appid and secret are required.');
    error.statusCode = 400;
    throw error;
  }
}

function validateUpstreamLoginSuccess(loginResponse) {
  if (Number(loginResponse?.code) !== 0) {
    const error = new Error(loginResponse?.msg || 'Upstream login failed.');
    error.statusCode = 502;
    error.details = loginResponse;
    throw error;
  }
}

function validateTenantInfoSuccess(tenantResponse) {
  if (Number(tenantResponse?.code) !== 0) {
    const error = new Error(tenantResponse?.msg || 'Failed to fetch tenant info from upstream.');
    error.statusCode = 502;
    error.details = tenantResponse;
    throw error;
  }

  if (!tenantResponse?.tenantName || !tenantResponse?.tenantId) {
    const error = new Error('Tenant response missing tenantName or tenantId.');
    error.statusCode = 502;
    error.details = tenantResponse;
    throw error;
  }
}

function buildClientLoginResponse(sessionData) {
  return {
    appid: sessionData.appid,
    secret: sessionData.secret,
    authorization: `Bearer ${sessionData.appid}::${sessionData.access_token}`,
    access_code: null
  };
}

function createAuthUseCases({ authGateway, sessionRepository }) {
  return {
    async login(payload) {
      const credentials = normalizeLoginPayload(payload);
      validateLoginCredentials(credentials);

      const loginResponse = await authGateway.login(credentials);
      validateUpstreamLoginSuccess(loginResponse);

      const accessToken = getAccessToken(loginResponse);

      if (!accessToken) {
        const error = new Error('Upstream login succeeded without access_token.');
        error.statusCode = 502;
        throw error;
      }

      const tenantResponse = await authGateway.getTenantInfo(accessToken);
      validateTenantInfoSuccess(tenantResponse);

      const sessionData = {
        appid: loginResponse?.appid || credentials.appid,
        secret: loginResponse?.secret || credentials.secret,
        access_token: accessToken,
        tenantName: tenantResponse.tenantName,
        tenantId: tenantResponse.tenantId
      };

      await sessionRepository.saveByAppId(sessionData.appid, sessionData);

      return buildClientLoginResponse(sessionData);
    },

    getProjects(token) {
      return authGateway.getProjects(token);
    },

    getTenant(token) {
      return authGateway.getTenant(token);
    }
  };
}

module.exports = {
  createAuthUseCases
};
