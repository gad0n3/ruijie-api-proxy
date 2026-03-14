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

/**
 * Creates the network group module, wiring up its dependencies.
 * @param {object} dependencies - The dependencies for the network group module.
 * @param {object} dependencies.networkGroupGateway - The network group gateway.
 * @param {object} dependencies.networkGroupSessionRepository - The session repository for network groups.
 * @returns {object} The network group module with its use cases and controller.
 */
function createNetworkGroupModule({
  networkGroupGateway,
  networkGroupSessionRepository,
}) {
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
