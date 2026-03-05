const { createNetworkGroupGateway } = require('./gateways/networkGroupGateway');
const { createNetworkGroupUseCases } = require('./useCases/networkGroupUseCases');
const { createNetworkGroupController } = require('./controllers/networkGroupController');

function createNetworkGroupModule() {
  const networkGroupGateway = createNetworkGroupGateway();
  const networkGroupUseCases = createNetworkGroupUseCases({ networkGroupGateway });
  const networkGroupController = createNetworkGroupController({ networkGroupUseCases });

  return {
    networkGroupUseCases,
    networkGroupController
  };
}

module.exports = {
  createNetworkGroupModule
};
