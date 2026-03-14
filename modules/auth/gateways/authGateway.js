const { upstreamRequest } = require("../../../helpers/upstreamHttp");
const config = require("../../../config");
const { AuthenticationError } = require("../../../helpers/AppError");
const logger = require("../../../helpers/logger"); // Import the logger

/**
 * Builds the request payload for the upstream login API.
 * @param {object} credentials - Object containing appid and secret.
 * @returns {object} The request configuration for axios.
 */
function buildLoginRequest(credentials) {
  return {
    method: "POST",
    url: "/oauth20/client/access_token",
    params: {
      token: config.ruijieLoginToken,
    },
    data: {
      appid: credentials.appid,
      secret: credentials.secret,
    },
    headers: {
      appid: credentials.appid,
      secret: credentials.secret,
    },
  };
}

/**
 * Extracts the access token from the upstream login response.
 * @param {object} loginResponse - The response object from the upstream login API.
 * @returns {string} The access token, or an empty string if not found.
 */
function getLoginAccessToken(loginResponse) {
  return loginResponse?.accessToken || loginResponse?.access_token || "";
}

/**
 * @typedef {object} AuthGateway
 * @property {(credentials: object) => Promise<object>} login - Authenticates with the upstream service.
 * @property {(accessToken: string) => Promise<object>} getTenantInfo - Fetches tenant information using an access token.
 * @property {(token: string) => Promise<object>} getProjects - Fetches project list using an access token.
 * @property {(token: string) => Promise<object>} getTenant - Fetches tenant details using an access token.
 */

/**
 * Creates an authentication gateway for interacting with the Ruijie upstream authentication API.
 * @returns {AuthGateway} An object implementing the AuthGateway interface.
 */
function createAuthGateway() {
  return {
    /**
     * Authenticates with the upstream service using app credentials.
     * @param {object} credentials - Contains appid and secret.
     * @returns {Promise<object>} The full response from the upstream login API.
     * @throws {AuthenticationError} If upstream login fails.
     */
    async login(credentials) {
      const request = buildLoginRequest(credentials);

      try {
        const response = await upstreamRequest(request);
        const upstreamCode = Number(response?.code);

        if (upstreamCode !== 0) {
          logger.error("[Uplink /oauth20/client/access_token] rejected", {
            appid: credentials?.appid || "",
            code: response?.code,
            msg: response?.msg,
            details: response,
          });

          throw new AuthenticationError(
            response?.msg || "Login failed",
            response,
          );
        }

        const accessToken = getLoginAccessToken(response);

        logger.info("[Uplink /oauth20/client/access_token] success", {
          appid: credentials?.appid || "",
          hasAccessToken: Boolean(accessToken),
          code: response?.code,
          msg: response?.msg,
        });

        if (accessToken) {
          logger.debug(
            "[Uplink /oauth20/client/access_token] access_token:",
            accessToken,
          );
        }

        return response;
      } catch (error) {
        logger.error("[Uplink /oauth20/client/access_token] failed", {
          appid: credentials?.appid || "",
          statusCode: error?.statusCode || 500,
          message: error?.message || "Upstream login failed",
          details: error?.details || null,
        });

        // Re-throw the error so it can be caught by the centralized error handler
        throw error;
      }
    },

    /**
     * Fetches tenant information from the upstream service.
     * @param {string} accessToken - The access token for authentication.
     * @returns {Promise<object>} The tenant information.
     */
    getTenantInfo(accessToken) {
      return upstreamRequest({
        method: "GET",
        url: "/org/tenant/info",
        token: accessToken,
        params: {
          access_token: accessToken,
        },
      });
    },

    /**
     * Fetches a list of projects from the upstream service.
     * @param {string} token - The access token for authentication.
     * @returns {Promise<object>} The project list.
     */
    getProjects(token) {
      return upstreamRequest({
        method: "GET",
        url: "/auth/core/projects",
        token,
      });
    },

    /**
     * Fetches tenant details from the upstream service.
     * @param {string} token - The access token for authentication.
     * @returns {Promise<object>} The tenant details.
     */
    getTenant(token) {
      return upstreamRequest({
        method: "GET",
        url: "/auth/core/tenant",
        token,
      });
    },
  };
}

module.exports = {
  createAuthGateway,
};
