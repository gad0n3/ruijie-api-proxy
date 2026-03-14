const express = require("express");
const { asyncHandler, bearerTokenMiddleware } = require("../middleware");

function createVoucherRoutes({ voucherController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  router.get("/active", asyncHandler(voucherController.listActiveVouchers));

  router.get("/remain", asyncHandler(voucherController.listRemainVouchers));

  router.get("/expired", asyncHandler(voucherController.listExpiredVouchers));

  router.get("/status", asyncHandler(voucherController.getVoucherStatus));

  router.get(
    "/performance",
    asyncHandler(voucherController.getVoucherPerformance),
  );

  router.post("/generate", asyncHandler(voucherController.generateVoucher));

  router.delete(
    "/expired",
    asyncHandler(voucherController.deleteExpiredVouchers),
  );

  return router;
}

module.exports = createVoucherRoutes;
