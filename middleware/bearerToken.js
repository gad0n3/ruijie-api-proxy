function bearerTokenMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Missing or invalid Authorization header. Use Bearer <token>.'
    });
  }

  req.bearerToken = authHeader.slice(7).trim();

  if (!req.bearerToken) {
    return res.status(401).json({
      message: 'Bearer token is empty.'
    });
  }

  next();
}

module.exports = bearerTokenMiddleware;
