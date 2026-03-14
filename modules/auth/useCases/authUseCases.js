const {
  ValidationError,
  UpstreamError,
  AuthenticationError,
  InternalServerError,
} = require("../../../helpers/AppError");
const { validate, isRequired } = require("../../../helpers/validation");
const { resolveAuthenticatedSession } = require("../../../helpers/tokenParser");

function getAccessToken(loginResponse) {
  return loginResponse?.accessToken || loginResponse?.access_token || "";
}

function normalizeLoginPayload(payload) {
  return {
    appid: payload?.appid || payload?.ruijie_id,
    secret: payload?.secret || payload?.ruijie_secret,
  };
}

function validateLoginCredentials(credentials) {
  validate(credentials, {
    appid: [isRequired("appid is required.")],
    secret: [isRequired("secret is required.")],
  });
}

function normalizeVipLoginPayload(payload) {
  return {
    username: payload?.username,
    password: payload?.password,
  };
}

function validateVipLoginCredentials(credentials) {
  validate(credentials, {
    username: [isRequired("username is required.")],
    password: [isRequired("password is required.")],
  });
}

function validateUpstreamLoginSuccess(loginResponse) {
  if (Number(loginResponse?.code) !== 0) {
    throw new UpstreamError(
      loginResponse?.msg || "Upstream login failed.",
      502,
      loginResponse,
    );
  }
}

function validateTenantInfoSuccess(tenantResponse) {
  if (Number(tenantResponse?.code) !== 0) {
    throw new UpstreamError(
      tenantResponse?.msg || "Failed to fetch tenant info from upstream.",
      502,
      tenantResponse,
    );
  }

  if (!tenantResponse?.tenantName || !tenantResponse?.tenantId) {
    throw new UpstreamError(
      "Tenant response missing tenantName or tenantId.",
      502,
      tenantResponse,
    );
  }
}

function buildClientLoginResponse(sessionData) {
  return {
    appid: sessionData.appid,
    secret: sessionData.secret,
    authorization: `Bearer ${sessionData.appid}::${sessionData.access_token}`,
    access_code: null,
  };
}

async function loginWithAppCredentials(
  { authGateway, sessionRepository },
  credentials,
) {
  const loginResponse = await authGateway.login(credentials);
  validateUpstreamLoginSuccess(loginResponse);

  const accessToken = getAccessToken(loginResponse);

  if (!accessToken) {
    throw new UpstreamError(
      "Upstream login succeeded without access_token.",
      502,
    );
  }

  const tenantResponse = await authGateway.getTenantInfo(accessToken);
  validateTenantInfoSuccess(tenantResponse);

  const sessionData = {
    appid: loginResponse?.appid || credentials.appid,
    secret: loginResponse?.secret || credentials.secret,
    access_token: accessToken,
    tenantName: tenantResponse.tenantName,
    tenantId: tenantResponse.tenantId,
  };

  await sessionRepository.saveByAppId(sessionData.appid, sessionData);

  return buildClientLoginResponse(sessionData);
}

function createAuthUseCases({
  authGateway,
  sessionRepository,
  vipCredentialRepository,
}) {
  return {
    async login(payload) {
      const credentials = normalizeLoginPayload(payload);
      validateLoginCredentials(credentials);

      return loginWithAppCredentials(
        { authGateway, sessionRepository },
        credentials,
      );
    },

    async loginVip(payload) {
      const credentials = normalizeVipLoginPayload(payload);
      validateVipLoginCredentials(credentials);

      if (
        !vipCredentialRepository ||
        typeof vipCredentialRepository.verify !== "function"
      ) {
        throw new InternalServerError(
          "VIP credential repository is not configured.",
        );
      }

      const mapped = await vipCredentialRepository.verify(
        credentials.username,
        credentials.password,
      );

      if (!mapped?.appid || !mapped?.secret) {
        throw new AuthenticationError("Invalid VIP credentials");
      }

      return loginWithAppCredentials(
        { authGateway, sessionRepository },
        {
          appid: mapped.appid,
          secret: mapped.secret,
        },
      );
    },

    getProjects(token) {
      return authGateway.getProjects(token);
    },

    getTenant(token) {
      return authGateway.getTenant(token);
    },
  };
}

module.exports = {
  createAuthUseCases,
};
