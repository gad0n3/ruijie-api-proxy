const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const bearerTokenMiddleware = require("../middleware/bearerToken");

function createClientRoutes({ clientController, voucherController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  // Refactored: GET /clients (previously GET /clients/auth)
  router.get("/", asyncHandler(clientController.listClients));

  // Print unused vouchers (delegates to voucher module)
  router.post("/print", asyncHandler(voucherController.printUnusedVouchers));

  // Removed:
  // - GET /unauth
  // - GET /suspected

  return router;
}

module.exports = createClientRoutes;
