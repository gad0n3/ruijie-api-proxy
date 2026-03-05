const { createPackageGateway } = require('./gateways/packageGateway');
const { createPackageUseCases } = require('./useCases/packageUseCases');
const { createPackageController } = require('./controllers/packageController');
const { createPackageSessionRepository } = require('./repositories/sessionRepository');

function createPackageModule() {
  const packageGateway = createPackageGateway();
  const packageSessionRepository = createPackageSessionRepository();
  const packageUseCases = createPackageUseCases({ packageGateway, packageSessionRepository });
  const packageController = createPackageController({ packageUseCases });

  return {
    packageUseCases,
    packageController
  };
}

module.exports = {
  createPackageModule
};
