const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const bearerTokenMiddleware = require('../middleware/bearerToken');

function createClientRoutes({ clientController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  router.get('/auth', asyncHandler(clientController.getAuthenticatedClients));

  router.get('/unauth', asyncHandler(clientController.getUnauthenticatedClients));

  router.get('/suspected', asyncHandler(clientController.getSuspectedClients));

  return router;
}

module.exports = createClientRoutes;
