const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const bearerTokenMiddleware = require('../middleware/bearerToken');

function createNetworkGroupRoutes({ networkGroupController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  router.get('/', asyncHandler(networkGroupController.listNetworkGroups));

  return router;
}

module.exports = createNetworkGroupRoutes;
