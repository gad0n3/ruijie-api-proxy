const express = require("express");
const { asyncHandler, bearerTokenMiddleware } = require("../middleware");

function createClientRoutes({ clientController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  // Refactored: GET /clients (previously GET /clients/auth)
  router.get("/", asyncHandler(clientController.listClients));

  // Removed:
  // - GET /unauth
  // - GET /suspected

  return router;
}

module.exports = createClientRoutes;
