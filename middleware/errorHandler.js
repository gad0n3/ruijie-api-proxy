const {
  AppError,
  InternalServerError,
  ConflictError,
} = require("../helpers/AppError");
const { isBypassedPath } = require("./responseEnvelope");
const logger = require("../helpers/logger");

function errorHandler(err, req, res, next) {
  // Log the error for debugging purposes
  logger.error(err);

  let error = err;

  // Handle specific upstream error mapping
  const isUsergroupNotSynced =
    Number(error.details?.voucherData?.code) === 1014;

  if (isUsergroupNotSynced) {
    error = new ConflictError("Selected usergroup is not synchronized yet.", {
      ...error.details,
      code: "USERGROUP_NOT_SYNCED",
      resetRequired: true,
      nextAction: "refresh_network_group_and_reselect",
    });
  } else if (!(error instanceof AppError)) {
    // If it's not an AppError, wrap it in an InternalServerError
    error = new InternalServerError(error.message, error);
  }

  // Handle bypassed paths
  if (isBypassedPath(req.originalUrl, req.path)) {
    const payload = {
      message: error.message,
    };

    if (error.details) {
      payload.details = error.details;
    }
    // For bypassed paths, we don't use the full envelope for errors, just a basic message and details
    return res.status(error.statusCode).json(payload);
  }

  // Respond with the standardized error envelope
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    error: {
      httpStatus: error.statusCode,
      name: error.name,
      details: error.details,
      // Only include specific codes/actions if they were set by UpstreamError or ConflictError
      ...(error.details?.code && { code: error.details.code }),
      ...(error.details?.resetRequired && {
        resetRequired: error.details.resetRequired,
      }),
      ...(error.details?.nextAction && {
        nextAction: error.details.nextAction,
      }),
    },
  });
}

module.exports = errorHandler;
