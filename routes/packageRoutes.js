const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const bearerTokenMiddleware = require('../middleware/bearerToken');

function createPackageRoutes({ packageController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  router.get('/', asyncHandler(packageController.listPackages));

  router.post('/create', asyncHandler(packageController.createPackage));

  router.post('/:groupId', asyncHandler(packageController.updatePackageGroup));

  router.delete('/:uuid', asyncHandler(packageController.deletePackage));

  return router;
}

module.exports = createPackageRoutes;
