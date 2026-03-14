const express = require("express");
const { asyncHandler, bearerTokenMiddleware } = require("../middleware");

function createNetworkGroupRoutes({ networkGroupController }) {
  const router = express.Router();

  router.use(bearerTokenMiddleware);

  router.get("/", asyncHandler(networkGroupController.listNetworkGroups));

  return router;
}

module.exports = createNetworkGroupRoutes;
