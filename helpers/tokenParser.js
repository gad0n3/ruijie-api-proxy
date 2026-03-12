function parseCompositeBearerToken(token) {
  if (!token || !token.includes('::')) {
    return null;
  }

  const parts = token.split('::');

  if (parts.length !== 2) {
    const error = new Error('Invalid bearer token format. Expected appid::token.');
    error.statusCode = 401;
    throw error;
  }

  const appid = parts[0].trim();
  const accessToken = parts[1].trim();

  if (!appid || !accessToken) {
    const error = new Error('Invalid bearer token format. Expected appid::token.');
    error.statusCode = 401;
    throw error;
  }

  return { appid, accessToken };
}

function extractAccessToken(token) {
  if (!token) {
    return '';
  }

  const parts = String(token).split('::');

  if (parts.length === 2) {
    return parts[1].trim();
  }

  return String(token).trim();
}

async function resolveAuthenticatedSession(token, sessionRepository) {
  const composite = parseCompositeBearerToken(token);

  if (!composite) {
    const error = new Error('Composite bearer token is required. Use Bearer appid::token.');
    error.statusCode = 401;
    throw error;
  }

  const session = await sessionRepository.getByAppId(composite.appid);

  if (!session) {
    const error = new Error('Session not found for provided appid. Please login again.');
    error.statusCode = 401;
    throw error;
  }

  if (session.access_token !== composite.accessToken) {
    const error = new Error('Bearer token is invalid or expired. Please login again.');
    error.statusCode = 401;
    throw error;
  }

  return { session, accessToken: composite.accessToken, appid: composite.appid };
}

module.exports = {
  parseCompositeBearerToken,
  extractAccessToken,
  resolveAuthenticatedSession
};
