const axios = require("axios");
const config = require("../config");
const { getSessionByAppId } = require("../infrastructure/sessionStore");
const { parseCompositeBearerToken } = require("./tokenParser");

const upstreamClient = axios.create({
  baseURL: config.upstreamBaseUrl,
  timeout: config.upstreamTimeoutMs,
});

function buildAuthHeader(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function resolveUpstreamAuthContext(token) {
  if (!token) {
    return { upstreamAccessToken: "", authHeaders: {} };
  }

  const composite = parseCompositeBearerToken(token);

  if (!composite) {
    return {
      upstreamAccessToken: token,
      authHeaders: buildAuthHeader(token),
    };
  }

  const session = await getSessionByAppId(composite.appid);

  if (!session) {
    const error = new Error(
      "Session not found for provided appid. Please login again.",
    );
    error.statusCode = 401;
    throw error;
  }

  if (session.access_token !== composite.accessToken) {
    const error = new Error(
      "Bearer token is invalid or expired. Please login again.",
    );
    error.statusCode = 401;
    throw error;
  }

  return {
    upstreamAccessToken: composite.accessToken,
    authHeaders: {
      ...buildAuthHeader(composite.accessToken),
      appid: session.appid || composite.appid,
      secret: session.secret || "",
    },
  };
}

async function upstreamRequest({ method, url, token, data, params, headers }) {
  if (!config.upstreamBaseUrl) {
    const error = new Error(
      "Upstream URL is not configured. Set UPSTREAM_BASE_URL (or RUIJIE_UPSTREAM_BASE_URL / UPSTREAM_URL) in .env.",
    );
    error.statusCode = 500;
    throw error;
  }

  try {
    const authContext = await resolveUpstreamAuthContext(token);

    const response = await upstreamClient.request({
      method,
      url,
      data,
      params,
      headers: {
        ...authContext.authHeaders,
        ...(headers || {}),
      },
    });

    return response.data;
  } catch (error) {
    const statusCode = error.statusCode || error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Upstream request failed";

    const proxyError = new Error(message);
    proxyError.statusCode = statusCode;
    proxyError.details = error.details || error.response?.data;
    throw proxyError;
  }
}

module.exports = {
  upstreamRequest,
};
