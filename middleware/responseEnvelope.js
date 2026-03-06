function isBypassedPath(originalUrl, path) {
  return originalUrl.startsWith('/docs');
}

function normalizeSuccessBody(body) {
  let message = 'OK';
  let data = body;
  const meta = {};

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const hasCodeMsg = Object.prototype.hasOwnProperty.call(body, 'code') &&
      Object.prototype.hasOwnProperty.call(body, 'msg');

    if (hasCodeMsg) {
      message = String(body.msg || 'OK');

      if (Object.prototype.hasOwnProperty.call(body, 'data')) {
        data = body.data;

        if (Object.prototype.hasOwnProperty.call(body, 'count')) {
          meta.count = body.count;
        }
      }
    } else if (
      Object.prototype.hasOwnProperty.call(body, 'list') &&
      Object.keys(body).length === 1
    ) {
      data = body.list;
    }
  }

  return {
    success: true,
    message,
    data,
    meta
  };
}

function isSuccessEnvelope(body) {
  return (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    Object.prototype.hasOwnProperty.call(body, 'success') &&
    Object.prototype.hasOwnProperty.call(body, 'message') &&
    Object.prototype.hasOwnProperty.call(body, 'data') &&
    Object.prototype.hasOwnProperty.call(body, 'meta')
  );
}

function isErrorEnvelope(body) {
  return (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    Object.prototype.hasOwnProperty.call(body, 'success') &&
    body.success === false &&
    Object.prototype.hasOwnProperty.call(body, 'message') &&
    Object.prototype.hasOwnProperty.call(body, 'error')
  );
}

function normalizeErrorBody(statusCode, body) {
  const message =
    (body && typeof body === 'object' && body.message) ||
    'Request failed';

  let details = null;

  if (body && typeof body === 'object') {
    if (body.error && typeof body.error === 'object' && Object.prototype.hasOwnProperty.call(body.error, 'details')) {
      details = body.error.details;
    } else if (Object.prototype.hasOwnProperty.call(body, 'details')) {
      details = body.details;
    }
  }

  return {
    success: false,
    message: String(message),
    error: {
      httpStatus: statusCode,
      details
    }
  };
}

function responseEnvelopeMiddleware(req, res, next) {
  if (isBypassedPath(req.originalUrl, req.path)) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function wrappedJson(body) {
    if (isSuccessEnvelope(body) || isErrorEnvelope(body)) {
      return originalJson(body);
    }

    if (res.statusCode >= 400) {
      return originalJson(normalizeErrorBody(res.statusCode, body));
    }

    return originalJson(normalizeSuccessBody(body));
  };

  next();
}

module.exports = {
  responseEnvelopeMiddleware,
  isBypassedPath
};
