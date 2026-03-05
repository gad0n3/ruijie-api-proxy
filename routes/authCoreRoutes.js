const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const bearerTokenMiddleware = require('../middleware/bearerToken');

function createAuthCoreRoutes({ authController }) {
  const router = express.Router();

  router.post('/login', asyncHandler(authController.login));

  router.get('/projects', bearerTokenMiddleware, asyncHandler(authController.getProjects));

  router.get('/tenant', bearerTokenMiddleware, asyncHandler(authController.getTenant));

  return router;
}

module.exports = createAuthCoreRoutes;
