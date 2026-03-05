const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const bearerTokenMiddleware = require('../middleware/bearerToken');

function createClientRoutes({ clientController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  router.get('/online', asyncHandler(clientController.getOnlineClients));

  router.post('/offline', asyncHandler(clientController.setClientsOffline));

  router.get('/current-users', asyncHandler(clientController.getCurrentUsers));

  return router;
}

module.exports = createClientRoutes;
