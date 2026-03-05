const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const bearerTokenMiddleware = require('../middleware/bearerToken');

function createVoucherRoutes({ voucherController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  router.get('/', asyncHandler(voucherController.listVouchers));

  router.post('/generate', asyncHandler(voucherController.generateVoucher));

  router.delete('/expired', asyncHandler(voucherController.deleteExpiredVouchers));

  return router;
}

module.exports = createVoucherRoutes;
