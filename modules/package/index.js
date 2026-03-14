const { createPackageGateway } = require("./gateways/packageGateway");
const { createPackageUseCases } = require("./useCases/packageUseCases");
const { createPackageController } = require("./controllers/packageController");
const {
  createPackageSessionRepository,
} = require("./repositories/sessionRepository");

/**
 * Creates the package module, wiring up its dependencies.
 * @param {object} dependencies - The dependencies for the package module.
 * @param {object} dependencies.packageGateway - The package gateway.
 * @param {object} dependencies.packageSessionRepository - The session repository for packages.
 * @returns {object} The package module with its use cases and controller.
 */
function createPackageModule({ packageGateway, packageSessionRepository }) {
  const packageUseCases = createPackageUseCases({
    packageGateway,
    packageSessionRepository,
  });
  const packageController = createPackageController({ packageUseCases });

  return {
    packageUseCases,
    packageController,
  };
}

module.exports = {
  createPackageModule,
};
