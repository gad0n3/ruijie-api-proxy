const { createNetworkGroupGateway } = require("./gateways/networkGroupGateway");
const {
  createNetworkGroupSessionRepository,
} = require("./repositories/sessionRepository");
const {
  createNetworkGroupUseCases,
} = require("./useCases/networkGroupUseCases");
const {
  createNetworkGroupController,
} = require("./controllers/networkGroupController");

function createNetworkGroupModule() {
  const networkGroupGateway = createNetworkGroupGateway();
  const networkGroupSessionRepository = createNetworkGroupSessionRepository();
  const networkGroupUseCases = createNetworkGroupUseCases({
    networkGroupGateway,
    networkGroupSessionRepository,
  });
  const networkGroupController = createNetworkGroupController({
    networkGroupUseCases,
  });

  return {
    networkGroupUseCases,
    networkGroupController,
  };
}

module.exports = {
  createNetworkGroupModule,
};
