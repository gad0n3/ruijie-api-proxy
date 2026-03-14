const { AuthenticationError } = require("../helpers/AppError");

/**
 * Middleware to extract and validate the Bearer token from the Authorization header.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 * @throws {AuthenticationError} If the Authorization header is missing, invalid, or the token is empty.
 */
function bearerTokenMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError(
      "Missing or invalid Authorization header. Use Bearer <token>.",
    );
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    throw new AuthenticationError("Bearer token is empty.");
  }

  req.bearerToken = token;

  next();
}

module.exports = bearerTokenMiddleware;
