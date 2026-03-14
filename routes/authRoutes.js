const express = require("express");
const { asyncHandler, bearerTokenMiddleware } = require("../middleware");

function createAuthRoutes({ authController }) {
  const router = express.Router();

  router.post("/login", asyncHandler(authController.login));
  router.post("/vip-login", asyncHandler(authController.loginVip));

  router.get(
    "/projects",
    bearerTokenMiddleware,
    asyncHandler(authController.getProjects),
  );

  router.get(
    "/tenant",
    bearerTokenMiddleware,
    asyncHandler(authController.getTenant),
  );

  return router;
}

module.exports = createAuthRoutes;
