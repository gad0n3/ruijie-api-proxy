const logger = require("../helpers/logger");

/**
 * Middleware for logging incoming requests and outgoing responses.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 */
function requestLogger(req, res, next) {
  logger.info("[Request]", {
    method: req.method,
    path: req.originalUrl,
    headers: req.headers,
    query: req.query,
    body: req.body,
  });

  res.on("finish", () => {
    logger.info("[Response]", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
    });
  });

  next();
}

module.exports = requestLogger;
