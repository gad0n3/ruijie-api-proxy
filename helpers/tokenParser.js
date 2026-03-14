const { AuthenticationError } = require("./AppError");

/**
 * Parses a composite bearer token in the format appid::token.
 * @param {string} token - The raw token string.
 * @returns {{ appid: string, accessToken: string }} Object containing appid and accessToken.
 * @throws {AuthenticationError} If the token format is invalid.
 */
function parseCompositeBearerToken(token) {
  const source = String(token || "").trim();
  const parts = source.split("::");

  if (parts.length !== 2) {
    throw new AuthenticationError(
      "Invalid bearer token format. Expected appid::token.",
    );
  }

  const appid = parts[0].trim();
  const accessToken = parts[1].trim();

  if (!appid || !accessToken) {
    throw new AuthenticationError(
      "Invalid bearer token format. Expected appid::token.",
    );
  }

  return { appid, accessToken };
}

/**
 * Extracts a bearer token from the Authorization header and parses it.
 * @param {string} authHeader - The Authorization header value.
 * @returns {{ appid: string, accessToken: string }|null} The parsed composite token or null if not present.
 */
function extractAccessToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return parseCompositeBearerToken(token);
}

/**
 * Resolves and validates an authenticated session from a token.
 * @param {string} token - The raw composite token.
 * @param {object} repository - The session repository instance.
 * @returns {Promise<{ session: object, accessToken: string }>} Object containing the session and accessToken.
 * @throws {AuthenticationError} If the session is invalid or not found.
 */
async function resolveAuthenticatedSession(token, repository) {
  if (!token) {
    throw new AuthenticationError(
      "Composite bearer token is required. Use Bearer appid::token.",
    );
  }

  const composite = parseCompositeBearerToken(token);

  const session = await repository.getByAppId(composite.appid);

  if (!session) {
    throw new AuthenticationError(
      "Session not found for provided appid. Please login again.",
    );
  }

  const storedAccessToken = session.access_token || session.accessToken;

  if (storedAccessToken !== composite.accessToken) {
    throw new AuthenticationError(
      "Bearer token is invalid or expired. Please login again.",
    );
  }

  return {
    session,
    accessToken: composite.accessToken,
  };
}

module.exports = {
  parseCompositeBearerToken,
  extractAccessToken,
  resolveAuthenticatedSession,
};
