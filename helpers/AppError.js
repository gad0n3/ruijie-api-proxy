class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // Mark as operational error
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation Error", details = null) {
    super(message, 400, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication Failed", details = null) {
    super(message, 401, details);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Unauthorized Access", details = null) {
    super(message, 403, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource Not Found", details = null) {
    super(message, 404, details);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource Conflict", details = null) {
    super(message, 409, details);
  }
}

class UpstreamError extends AppError {
  constructor(message = "Upstream Service Error", statusCode = 502, details = null) {
    super(message, statusCode, details);
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal Server Error", details = null) {
    super(message, 500, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  UpstreamError,
  InternalServerError,
};
