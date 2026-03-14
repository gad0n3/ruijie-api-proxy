const app = require("./app");
const config = require("./config");
const logger = require("./helpers/logger");

app.listen(config.port, () => {
  logger.info(`ruijie-api-proxy running on port ${config.port}`);
});
