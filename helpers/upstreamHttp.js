const axios = require("axios");
const config = require("../config");
const {
  UpstreamError,
  InternalServerError,
  AuthenticationError,
} = require("./AppError");
const { parseCompositeBearerToken } = require("./tokenParser");

/**
 * Resolves session and token context for authenticated upstream calls.
 * This helper ensures the provided composite token (appid::token) matches
 * a valid session in the repository.
 *
 * @param {string} token - The composite bearer token.
 * @param {object} sessionRepository - The repository to look up the session.
 * @returns {Promise<{ session: object, accessToken: string }>}
 * @throws {AuthenticationError} If token is missing, session not found, or token mismatch.
 */
async function resolveUpstreamAuthContext(token, sessionRepository) {
  if (!token) {
    throw new AuthenticationError("Authentication token is required.");
  }

  // parseCompositeBearerToken handles format validation and throws AuthenticationError if invalid
  const composite = parseCompositeBearerToken(token);
  const session = await sessionRepository.getByAppId(composite.appid);

  if (!session) {
    throw new AuthenticationError(
      "Session not found for provided appid. Please login again.",
    );
  }

  const currentToken = session.access_token || session.accessToken;
  if (currentToken !== composite.accessToken) {
    throw new AuthenticationError(
      "Bearer token is invalid or expired. Please login again.",
    );
  }

  return { session, accessToken: currentToken };
}

/**
 * Standardized HTTP client for making requests to Ruijie upstream services.
 * Automatically handles base URL, timeout, and wraps errors into UpstreamError.
 *
 * @param {object} options - Request configuration.
 * @param {string} options.method - HTTP method (GET, POST, etc.).
 * @param {string} options.url - The endpoint path.
 * @param {object} [options.data] - The request body.
 * @param {object} [options.params] - Query string parameters.
 * @param {string} [options.token] - Optional bearer token for Authorization header.
 * @param {object} [options.headers] - Custom headers to merge.
 * @returns {Promise<any>} The response data from the upstream service.
 * @throws {InternalServerError} If upstream configuration is missing.
 * @throws {UpstreamError} If the network request fails or returns an error status.
 */
const logger = require("./logger");

async function upstreamRequest(options = {}) {
  const { method = "GET", url, data, params, token, headers = {} } = options;

  if (!config.upstreamBaseUrl) {
    throw new InternalServerError(
      "Upstream base URL is not configured. Please check environment variables.",
    );
  }

  const axiosConfig = {
    method,
    baseURL: config.upstreamBaseUrl,
    url,
    data,
    params,
    timeout: config.upstreamTimeoutMs,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (token) {
    axiosConfig.headers["Authorization"] = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  // Log the outgoing request
  logger.info("[Uplink Request]", {
    method: axiosConfig.method,
    url: axiosConfig.url,
    baseURL: axiosConfig.baseURL,
    params: axiosConfig.params,
    data: axiosConfig.data,
  });

  try {
    const response = await axios(axiosConfig);

    // Log the successful response
    logger.info("[Uplink Response] Success", {
      method: axiosConfig.method,
      url: axiosConfig.url,
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    // Determine status code and message from Axios error
    const statusCode = error.response?.status || 502;
    const details = error.response?.data || null;

    // Log the failed response
    logger.error("[Uplink Response] Failed", {
      method: axiosConfig.method,
      url: axiosConfig.url,
      status: statusCode,
      details,
      error: error.message,
    });

    const message =
      details?.message ||
      details?.msg ||
      error.message ||
      "Upstream request failed";

    throw new UpstreamError(message, statusCode, details);
  }
}

module.exports = {
  resolveUpstreamAuthContext,
  upstreamRequest,
};
